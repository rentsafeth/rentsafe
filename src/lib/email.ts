import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM_EMAIL = 'RentSafe <noreply@rentsafe.in.th>';
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://rentsafe.in.th';

export async function sendShopApprovedEmail(to: string, shopName: string, shopId: string) {
    try {
        const { data, error } = await resend.emails.send({
            from: FROM_EMAIL,
            to: [to],
            subject: `ยินดีด้วย! ร้าน "${shopName}" ได้รับการอนุมัติแล้ว`,
            html: `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background-color: #f4f4f5;">
    <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background-color: white; border-radius: 12px; padding: 40px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <div style="text-align: center; margin-bottom: 30px;">
                <div style="background-color: #22c55e; width: 60px; height: 60px; border-radius: 50%; margin: 0 auto 15px; display: flex; align-items: center; justify-content: center;">
                    <span style="font-size: 30px;">✓</span>
                </div>
                <h1 style="color: #22c55e; margin: 0; font-size: 24px;">ร้านค้าได้รับการอนุมัติแล้ว!</h1>
            </div>

            <p style="color: #374151; font-size: 16px; line-height: 1.6;">
                สวัสดีครับ/ค่ะ
            </p>

            <p style="color: #374151; font-size: 16px; line-height: 1.6;">
                เรายินดีที่จะแจ้งให้ทราบว่าร้าน <strong>"${shopName}"</strong> ได้ผ่านการตรวจสอบและได้รับการอนุมัติเรียบร้อยแล้ว
            </p>

            <p style="color: #374151; font-size: 16px; line-height: 1.6;">
                ตอนนี้ร้านค้าของคุณพร้อมให้บริการบน RentSafe แล้ว ลูกค้าสามารถค้นหาและเห็นร้านของคุณได้
            </p>

            <div style="text-align: center; margin: 30px 0;">
                <a href="${SITE_URL}/th/shop/${shopId}"
                   style="background-color: #2563eb; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block;">
                    ดูหน้าร้านค้าของคุณ
                </a>
            </div>

            <p style="color: #6b7280; font-size: 14px; line-height: 1.6;">
                หากมีข้อสงสัยหรือต้องการความช่วยเหลือ สามารถติดต่อเราได้ตลอดเวลา
            </p>

            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">

            <p style="color: #9ca3af; font-size: 12px; text-align: center; margin: 0;">
                © ${new Date().getFullYear()} RentSafe - ระบบตรวจสอบร้านเช่ารถ
            </p>
        </div>
    </div>
</body>
</html>
            `,
        });

        if (error) {
            console.error('[Email] Failed to send approval email:', error);
            return { success: false, error };
        }

        console.log('[Email] Approval email sent:', data);
        return { success: true, data };
    } catch (error) {
        console.error('[Email] Error sending approval email:', error);
        return { success: false, error };
    }
}

export async function sendShopRejectedEmail(to: string, shopName: string, reason?: string) {
    try {
        const { data, error } = await resend.emails.send({
            from: FROM_EMAIL,
            to: [to],
            subject: `แจ้งผลการตรวจสอบร้าน "${shopName}"`,
            html: `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background-color: #f4f4f5;">
    <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background-color: white; border-radius: 12px; padding: 40px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <div style="text-align: center; margin-bottom: 30px;">
                <div style="background-color: #ef4444; width: 60px; height: 60px; border-radius: 50%; margin: 0 auto 15px; display: flex; align-items: center; justify-content: center;">
                    <span style="font-size: 30px; color: white;">✕</span>
                </div>
                <h1 style="color: #ef4444; margin: 0; font-size: 24px;">ร้านค้าไม่ผ่านการอนุมัติ</h1>
            </div>

            <p style="color: #374151; font-size: 16px; line-height: 1.6;">
                สวัสดีครับ/ค่ะ
            </p>

            <p style="color: #374151; font-size: 16px; line-height: 1.6;">
                เราขอแจ้งให้ทราบว่าร้าน <strong>"${shopName}"</strong> ไม่ผ่านการตรวจสอบในครั้งนี้
            </p>

            ${reason ? `
            <div style="background-color: #fef2f2; border-left: 4px solid #ef4444; padding: 15px; margin: 20px 0; border-radius: 0 8px 8px 0;">
                <p style="color: #991b1b; margin: 0; font-size: 14px;">
                    <strong>เหตุผล:</strong> ${reason}
                </p>
            </div>
            ` : ''}

            <p style="color: #374151; font-size: 16px; line-height: 1.6;">
                คุณสามารถแก้ไขข้อมูลและส่งคำขอใหม่ได้อีกครั้ง หรือติดต่อเราหากต้องการข้อมูลเพิ่มเติม
            </p>

            <div style="text-align: center; margin: 30px 0;">
                <a href="${SITE_URL}/th/dashboard"
                   style="background-color: #2563eb; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block;">
                    ไปที่แดชบอร์ด
                </a>
            </div>

            <p style="color: #6b7280; font-size: 14px; line-height: 1.6;">
                หากมีข้อสงสัยหรือต้องการความช่วยเหลือ สามารถติดต่อเราได้ตลอดเวลา
            </p>

            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">

            <p style="color: #9ca3af; font-size: 12px; text-align: center; margin: 0;">
                © ${new Date().getFullYear()} RentSafe - ระบบตรวจสอบร้านเช่ารถ
            </p>
        </div>
    </div>
</body>
</html>
            `,
        });

        if (error) {
            console.error('[Email] Failed to send rejection email:', error);
            return { success: false, error };
        }

        console.log('[Email] Rejection email sent:', data);
        return { success: true, data };
    } catch (error) {
        console.error('[Email] Error sending rejection email:', error);
        return { success: false, error };
    }
}
