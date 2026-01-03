import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Lightbulb, Copy, MessageCircle, Facebook, MoreHorizontal, Share2 } from 'lucide-react';
import React from 'react';

export default function FacebookUrlGuideModal() {
    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0 ml-2 rounded-full hover:bg-yellow-100 text-yellow-500 hover:text-yellow-600" type="button" title="วิธีดูลิงก์ Facebook">
                    <Lightbulb className="w-4 h-4" />
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md bg-white">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-blue-600">
                        <Lightbulb className="w-5 h-5 fill-yellow-400 text-yellow-500" />
                        วิธีดูลิงก์ Facebook Page ของมิจฉาชีพ
                    </DialogTitle>
                    <DialogDescription className="text-slate-500 text-sm">
                        เลือกวิธีดูจากแชท Messenger หรือหน้าเพจโดยตรง เพื่อให้ได้ลิงก์ที่ถูกต้องสำหรับการรายงาน
                    </DialogDescription>
                </DialogHeader>

                <Tabs defaultValue="messenger" className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="messenger" className="flex items-center gap-2">
                            <MessageCircle className="w-4 h-4" />
                            ดูจากแชท (Messenger)
                        </TabsTrigger>
                        <TabsTrigger value="page" className="flex items-center gap-2">
                            <Facebook className="w-4 h-4" />
                            ดูจากหน้าเพจ
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="messenger" className="space-y-4 pt-4">
                        <div className="space-y-4">
                            <Step
                                num={1}
                                text="กดที่ 'ชื่อเพจ' ด้านบนสุดของห้องแชท"
                                icon={<MessageCircle className="w-8 h-8 text-blue-500" />}
                            />
                            <Step
                                num={2}
                                text="กดปุ่ม 'โปรไฟล์' (Profile)"
                                icon={<Facebook className="w-8 h-8 text-blue-600" />}
                            />
                            <Step
                                num={3}
                                text="กดที่จุด 3 จุด (...) ด้านขวาบน หรือกดปุ่ม Share"
                                icon={<MoreHorizontal className="w-8 h-8 text-slate-600" />}
                            />
                            <Step
                                num={4}
                                text={
                                    <span>
                                        เลือกเมนู 'คัดลอกลิงก์' (Copy Link)
                                        <span className="text-xs text-slate-500 font-normal mt-1 block">
                                            *หากลิงก์ยาว พิมพ์เฉพาะชื่อหลัง https://www.facebook.com/ ก็ได้ (เช่น facebook.com/<strong>kuntoncarrent</strong> ให้พิมพ์แค่ <strong>kuntoncarrent</strong>)
                                        </span>
                                    </span>
                                }
                                icon={<Copy className="w-8 h-8 text-green-600" />}
                            />
                        </div>
                        <div className="bg-blue-50 p-3 rounded-lg text-sm text-blue-700 mt-4">
                            <strong>เคล็ดลับ:</strong> ลิงก์ที่ได้จะถูกต้องที่สุดเมื่อก๊อปปี้จากวิธีนี้
                        </div>
                    </TabsContent>

                    <TabsContent value="page" className="space-y-4 pt-4">
                        <div className="space-y-4">
                            <Step
                                num={1}
                                text="เข้าไปที่หน้าโปรไฟล์ของเพจคนโกง"
                                icon={<Facebook className="w-8 h-8 text-blue-600" />}
                            />
                            <Step
                                num={2}
                                text="กดปุ่ม 'แชร์' (Share) หรือ จุด 3 จุด (...)"
                                icon={<Share2 className="w-8 h-8 text-slate-600" />}
                            />
                            <Step
                                num={3}
                                text={
                                    <span>
                                        เลือกเมนู 'คัดลอกลิงก์' (Copy Link)
                                        <span className="text-xs text-slate-500 font-normal mt-1 block">
                                            *หากลิงก์ยาว พิมพ์เฉพาะชื่อหลัง https://www.facebook.com/ ก็ได้ (เช่น facebook.com/<strong>kuntoncarrent</strong> ให้พิมพ์แค่ <strong>kuntoncarrent</strong>)
                                        </span>
                                    </span>
                                }
                                icon={<Copy className="w-8 h-8 text-green-600" />}
                            />
                        </div>
                    </TabsContent>
                </Tabs>
            </DialogContent>
        </Dialog>
    );
}

const Step = ({ num, text, icon }: { num: number, text: React.ReactNode, icon: React.ReactNode }) => (
    <div className="flex items-center gap-4 bg-slate-50 p-3 rounded-xl border border-slate-100">
        <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center">
            {icon}
        </div>
        <div className="flex-1">
            <span className="text-xs font-bold text-slate-400 uppercase mb-0.5 block">Step {num}</span>
            <div className="text-slate-700 text-sm font-medium">{text}</div>
        </div>
    </div>
);
