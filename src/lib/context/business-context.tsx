'use client'

import { createContext, useContext } from 'react'
import type { Business, BusinessTheme, BusinessProfile, Staff, Service } from '@/lib/types'

export interface BusinessContextType {
  business: Business
  theme: BusinessTheme
  profile: BusinessProfile
  staff: Staff[]
  services: Service[]
}

const BusinessContext = createContext<BusinessContextType | null>(null)

export function BusinessProvider({
  children,
  value,
}: {
  children: React.ReactNode
  value: BusinessContextType
}) {
  return (
    <BusinessContext.Provider value={value}>
      {children}
    </BusinessContext.Provider>
  )
}

export function useBusiness() {
  const context = useContext(BusinessContext)
  if (!context) {
    throw new Error('useBusiness must be used within a BusinessProvider')
  }
  return context
}
