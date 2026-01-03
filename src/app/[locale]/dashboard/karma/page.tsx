import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

import { Heart, ArrowLeft, History, TrendingUp, TrendingDown } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';


export default async function KarmaHistoryPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect('/login');
    }

    // Get profile for current balance
    const { data: profile } = await supabase
        .from('profiles')
        .select('karma_credits')
        .eq('id', user.id)
        .single();

    // Get transaction history
    const { data: transactions } = await supabase
        .from('karma_transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

    return (
        <div className="container mx-auto px-4 py-8 max-w-4xl">
            <div className="mb-6">
                <Link href="/dashboard">
                    <Button variant="ghost" className="pl-0 hover:bg-transparent hover:text-blue-600">
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        กลับไป Dashboard
                    </Button>
                </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                {/* Balance Card */}
                <Card className="md:col-span-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white border-none shadow-lg">
                    <CardContent className="p-8 flex items-center justify-between">
                        <div>
                            <p className="text-purple-100 font-medium mb-1">เครดิตปลอบใจคงเหลือ</p>
                            <h1 className="text-5xl font-bold">{profile?.karma_credits || 0}</h1>
                            <p className="text-sm text-purple-200 mt-2 bg-white/20 inline-block px-3 py-1 rounded-full">
                                ติดตามสิทธิพิเศษเร็วๆนี้!
                            </p>
                        </div>
                        <div className="bg-white/20 p-4 rounded-full">
                            <Heart className="w-12 h-12 text-white" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <History className="w-5 h-5" />
                        ประวัติการได้รับเครดิต
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {!transactions || transactions.length === 0 ? (
                        <div className="text-center py-12 text-gray-500">
                            <Heart className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                            <p>ยังไม่มีประวัติการได้รับเครดิต</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {transactions.map((tx) => (
                                <div key={tx.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                                    <div className="flex items-start gap-4">
                                        <div className={`p-2 rounded-full ${tx.type === 'credit'
                                            ? 'bg-green-100 text-green-600'
                                            : 'bg-red-100 text-red-600'
                                            }`}>
                                            {tx.type === 'credit' ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
                                        </div>
                                        <div>
                                            <p className="font-medium text-gray-900">
                                                {tx.description || (tx.type === 'credit' ? 'ได้รับเครดิต' : 'หักเครดิต')}
                                            </p>
                                            <p className="text-sm text-gray-500">
                                                {new Date(tx.created_at).toLocaleString('th-TH', {
                                                    timeZone: 'Asia/Bangkok',
                                                    year: 'numeric',
                                                    month: 'short',
                                                    day: 'numeric',
                                                    hour: '2-digit',
                                                    minute: '2-digit'
                                                })}
                                            </p>
                                        </div>
                                    </div>
                                    <div className={`text-lg font-bold ${tx.type === 'credit' ? 'text-green-600' : 'text-red-600'
                                        }`}>
                                        {tx.type === 'credit' ? '+' : ''}{tx.amount}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
