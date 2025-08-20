import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function POST(req: NextRequest) {
  const { name, email, message } = await req.json();
  
  if (!name || !email || !message) {
    return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
  }

  try {
    const transporter = nodemailer.createTransporter({
      host: process.env.SMTP_HOST!,
      port: Number(process.env.SMTP_PORT || 587),
      secure: false,
      auth: { 
        user: process.env.SMTP_USER!, 
        pass: process.env.SMTP_PASS! 
      }
    });

    await transporter.sendMail({
      from: `MediMetrics Site <${process.env.SMTP_USER!}>`,
      to: process.env.SMTP_TO!,
      subject: 'Demo request — MediMetrics',
      text: `${name} <${email}> says:\n\n${message}`
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Email send error:', error);
    return NextResponse.json({ error: 'Failed to send email' }, { status: 500 });
  }
}