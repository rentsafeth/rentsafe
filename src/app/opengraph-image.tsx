import { ImageResponse } from 'next/og'

export const runtime = 'edge'

export const alt = 'RentSafe - ตรวจสอบร้านเช่ารถที่น่าเชื่อถือ'
export const size = {
    width: 1200,
    height: 630,
}

export const contentType = 'image/png'

export default function Image() {
    return new ImageResponse(
        (
            <div
                style={{
                    fontSize: 128,
                    background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontFamily: 'sans-serif',
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 20 }}>
                    <svg
                        width="160"
                        height="160"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    >
                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                        <path d="m9 12 2 2 4-4" />
                    </svg>
                    <span style={{ fontWeight: 'bold' }}>RentSafe</span>
                </div>
                <div style={{ fontSize: 48, opacity: 0.9 }}>
                    ตรวจสอบร้านเช่ารถที่น่าเชื่อถือ
                </div>
            </div>
        ),
        {
            ...size,
        }
    )
}
