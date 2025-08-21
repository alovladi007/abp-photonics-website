import { Injectable, OnApplicationBootstrap } from '@nestjs/common';
import { DataSource } from 'typeorm';

@Injectable()
export class DbBootstrapService implements OnApplicationBootstrap {
  constructor(private ds: DataSource) {}

  async onApplicationBootstrap() {
    await this.ds.query(`CREATE EXTENSION IF NOT EXISTS timescaledb CASCADE;`);
    await this.ds.query(`CREATE EXTENSION IF NOT EXISTS vector;`);

    await this.ds.query(`
      SELECT create_hypertable('signal_chunks', 't_start', if_not_exists => TRUE);
    `);
    await this.ds.query(`
      SELECT create_hypertable('features', 'window_start', if_not_exists => TRUE);
    `);
  }
}