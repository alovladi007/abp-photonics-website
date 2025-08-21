import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan } from 'typeorm';
import { SignalChunk } from '../entities/signal-chunk.entity';
import { Feature } from '../entities/feature.entity';

type IngestBody = {
  patientId: string;
  channel: string;
  fs: number;
  tStart: string;
  values: number[];
};

@Controller('/signals')
export class SignalsController {
  constructor(
    @InjectRepository(SignalChunk) private chunks: Repository<SignalChunk>,
    @InjectRepository(Feature) private features: Repository<Feature>,
  ) {}

  @Post('/ingest')
  async ingest(@Body() body: IngestBody) {
    const tStart = new Date(body.tStart);
    const durationSec = body.values.length / body.fs;
    const tEnd = new Date(tStart.getTime() + durationSec * 1000);
    const row = this.chunks.create({
      patientId: body.patientId, channel: body.channel, fs: body.fs,
      tStart, tEnd, values: body.values
    });
    await this.chunks.save(row);
    return { ok: true, id: row.id };
  }

  @Get('/recent')
  async recent(
    @Query('patientId') patientId: string,
    @Query('channel') channel: string,
    @Query('sinceMs') sinceMs?: string
  ) {
    const since = sinceMs ? new Date(Date.now() - parseInt(sinceMs, 10)) : new Date(Date.now() - 60_000);
    const rows = await this.chunks.find({
      where: { patientId, channel, tStart: MoreThan(since) },
      order: { tStart: 'ASC' },
      take: 200
    });
    return rows;
  }

  @Post('/extract-and-predict')
  async extractAndPredict(
    @Body() body: { patientId: string; channel: string; modelVersion?: string }
  ) {
    const rows = await this.chunks.find({
      where: { patientId: body.patientId, channel: body.channel },
      order: { tStart: 'DESC' },
      take: 1
    });
    if (!rows.length) return { error: 'no-data' };

    const chunk = rows[0];
    const vals = chunk.values || [];
    if (!vals.length) return { error: 'empty-chunk' };

    const mean = vals.reduce((a, b) => a + b, 0) / vals.length;
    const var_ = vals.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / Math.max(vals.length - 1, 1);
    const std = Math.sqrt(var_);
    const rms = Math.sqrt(vals.reduce((a, b) => a + b*b, 0) / vals.length);

    const fWindowStart = chunk.tStart;
    const fWindowEnd = chunk.tEnd;
    const feats = [
      this.features.create({ patientId: chunk.patientId, windowStart: fWindowStart, windowEnd: fWindowEnd, name: 'mean', value: mean, method: 'demo' }),
      this.features.create({ patientId: chunk.patientId, windowStart: fWindowStart, windowEnd: fWindowEnd, name: 'std', value: std, method: 'demo' }),
      this.features.create({ patientId: chunk.patientId, windowStart: fWindowStart, windowEnd: fWindowEnd, name: 'rms', value: rms, method: 'demo' }),
    ];
    await this.features.save(feats);

    const res = await fetch(`${process.env.INFERENCE_URL}/predict`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-api-key': process.env.INFERENCE_KEY ?? '' },
      body: JSON.stringify({ features: [mean, std, rms], modelVersion: body.modelVersion || 'demo-1' })
    });
    const data = await res.json();
    return { features: { mean, std, rms }, prediction: data };
  }
}