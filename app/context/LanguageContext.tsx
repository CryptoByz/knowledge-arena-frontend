'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'
import { Lang } from '../config/translations'

interface LanguageContextProps {
  language: Lang
  setLanguage: (lang: Lang) => void
}

const LanguageContext = createContext<LanguageContextProps>({
  language: 'en',
  setLanguage: () => {}
})

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Lang>('en')

  useEffect(() => {
    const stored = localStorage.getItem('language') as Lang
    if (stored === 'en' || stored === 'tr') {
      setLanguageState(stored)
    } else {
      setLanguageState('en')
    }
  }, [])

  const setLanguage = (lang: Lang) => {
    setLanguageState(lang)
    localStorage.setItem('language', lang)
  }

  return (
    <LanguageContext.Provider value={{ language, setLanguage }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  return useContext(LanguageContext)
}
