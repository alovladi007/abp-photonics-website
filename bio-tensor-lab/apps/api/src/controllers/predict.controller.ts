import { Body, Controller, Post } from '@nestjs/common';

type PredictBody = { features: number[]; modelVersion?: string };

@Controller()
export class PredictController {
  @Post('/predict')
  async predict(@Body() body: PredictBody) {
    const res = await fetch(`${process.env.INFERENCE_URL}/predict`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': process.env.INFERENCE_KEY ?? ''
      },
      body: JSON.stringify(body)
    });
    const data = await res.json();
    return data;
  }
}