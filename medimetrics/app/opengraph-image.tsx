import { ImageResponse } from '@vercel/og';

export const runtime = 'edge';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function OG() {
  return new ImageResponse(
    (
      <div style={{
        height: '100%', 
        width: '100%', 
        display: 'flex', 
        flexDirection: 'column',
        alignItems: 'center', 
        justifyContent: 'center', 
        background: '#0f172a', 
        color: 'white'
      }}>
        <div style={{ fontSize: 42, fontWeight: 700 }}>MediMetrics</div>
        <div style={{ marginTop: 10, fontSize: 24 }}>Explainable Medical Imaging AI</div>
      </div>
    ),
    { ...size }
  );
}