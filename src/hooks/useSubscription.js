import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/context/AuthContext'

export function useSubscription() {
  const { user } = useAuth()
  const [subscription, setSub] = useState(null)
  const [loading, setLoading]  = useState(true)

  useEffect(() => {
    if (!user) { setLoading(false); return }
    supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle()          // returns null (not an error) when no row exists
      .then(({ data }) => {
        setSub(data)
        setLoading(false)
      })
  }, [user])

  const isPaid = subscription?.plan === 'paid' &&
    subscription?.status === 'active' &&
    (!subscription?.paid_until || new Date(subscription.paid_until) > new Date())

  const isTrial = subscription?.plan === 'trial' &&
    subscription?.status === 'active' &&
    (!subscription?.trial_ends_at || new Date(subscription.trial_ends_at) > new Date())

  const hasFullAccess = isPaid || isTrial

  return { subscription, loading, isPaid, isTrial, hasFullAccess }
}
