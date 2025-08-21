import { Injectable, OnApplicationBootstrap } from '@nestjs/common';
import { DataSource } from 'typeorm';

@Injectable()
export class DbBootstrapService implements OnApplicationBootstrap {
  constructor(private ds: DataSource) {}

  async onApplicationBootstrap() {
    // Create extensions (idempotent), then hypertables
    await this.ds.query(`CREATE EXTENSION IF NOT EXISTS timescaledb CASCADE;`);
    await this.ds.query(`CREATE EXTENSION IF NOT EXISTS vector;`);

    // Create hypertable for signal_chunks based on t_start
    await this.ds.query(`
      SELECT create_hypertable('signal_chunks', 't_start', if_not_exists => TRUE);
    `);
    // Features can remain a regular table or be hypertable by window_start
    await this.ds.query(`
      SELECT create_hypertable('features', 'window_start', if_not_exists => TRUE);
    `);
  }
}