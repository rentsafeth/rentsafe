import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import ShopRegistrationForm from '@/components/features/shop/ShopRegistrationForm';

export default async function ShopRegisterPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect('/login');
    }

    // Check if user already has a shop
    const { data: existingShop } = await supabase
        .from('shops')
        .select('id')
        .eq('owner_id', user.id)
        .single();

    if (existingShop) {
        redirect(`/shop/${existingShop.id}`);
    }

    return (
        <div className="container mx-auto px-4 py-8 max-w-3xl">
            <h1 className="text-3xl font-bold mb-2">ลงทะเบียนร้านเช่ารถ</h1>
            <p className="text-slate-600 mb-8">กรอกข้อมูลร้านของคุณเพื่อสร้างความน่าเชื่อถือให้กับลูกค้า</p>

            <ShopRegistrationForm userId={user.id} />
        </div>
    );
}
