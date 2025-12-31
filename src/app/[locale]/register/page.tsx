'use client'

import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import { ShieldCheck, User, Store, ArrowRight } from 'lucide-react'
import Link from 'next/link'

export default function RegisterTypePage() {
    const t = useTranslations('Common')
    const tRegister = useTranslations('RegisterPage')
    const router = useRouter()

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50 px-4 py-12">
            <div className="w-full max-w-2xl">
                {/* Logo */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-2xl mb-4">
                        <ShieldCheck className="w-8 h-8 text-white" />
                    </div>
                    <h1 className="text-3xl font-bold text-gray-900">{tRegister('title')}</h1>
                    <p className="text-gray-500 mt-2">{tRegister('subtitle')}</p>
                </div>

                {/* Options */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* User Option */}
                    <button
                        onClick={() => router.push('/register/user')}
                        className="bg-white rounded-2xl shadow-lg border-2 border-gray-100 p-8 text-left hover:border-blue-500 hover:shadow-xl transition-all group"
                    >
                        <div className="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center mb-4 group-hover:bg-blue-600 transition-colors">
                            <User className="w-7 h-7 text-blue-600 group-hover:text-white transition-colors" />
                        </div>
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">{tRegister('userTitle')}</h3>
                        <p className="text-gray-500 text-sm mb-4">
                            {tRegister('userDescription')}
                        </p>
                        <ul className="text-sm text-gray-600 space-y-2 mb-4">
                            <li className="flex items-center gap-2">
                                <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span>
                                {tRegister('userFeature1')}
                            </li>
                            <li className="flex items-center gap-2">
                                <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span>
                                {tRegister('userFeature2')}
                            </li>
                            <li className="flex items-center gap-2">
                                <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span>
                                {tRegister('userFeature3')}
                            </li>
                        </ul>
                        <div className="flex items-center text-blue-600 font-medium">
                            {tRegister('registerAsUser')}
                            <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                        </div>
                    </button>

                    {/* Shop Option */}
                    <button
                        onClick={() => router.push('/register/shop')}
                        className="bg-white rounded-2xl shadow-lg border-2 border-gray-100 p-8 text-left hover:border-green-500 hover:shadow-xl transition-all group"
                    >
                        <div className="w-14 h-14 bg-green-100 rounded-xl flex items-center justify-center mb-4 group-hover:bg-green-600 transition-colors">
                            <Store className="w-7 h-7 text-green-600 group-hover:text-white transition-colors" />
                        </div>
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">{tRegister('shopTitle')}</h3>
                        <p className="text-gray-500 text-sm mb-4">
                            {tRegister('shopDescription')}
                        </p>
                        <ul className="text-sm text-gray-600 space-y-2 mb-4">
                            <li className="flex items-center gap-2">
                                <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                                {tRegister('shopFeature1')}
                            </li>
                            <li className="flex items-center gap-2">
                                <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                                {tRegister('shopFeature2')}
                            </li>
                            <li className="flex items-center gap-2">
                                <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                                {tRegister('shopFeature3')}
                            </li>
                        </ul>
                        <div className="flex items-center text-green-600 font-medium">
                            {tRegister('registerAsShop')}
                            <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                        </div>
                    </button>
                </div>

                {/* Already have account */}
                <div className="text-center mt-8">
                    <p className="text-gray-500">
                        {tRegister('alreadyHaveAccount')}{' '}
                        <Link href="/login" className="text-blue-600 font-medium hover:underline">
                            {t('login')}
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    )
}
