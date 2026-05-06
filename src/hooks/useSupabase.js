import { useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'

export function useSupabaseQuery(table, options = {}) {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const fetch = useCallback(async (extraOptions = {}) => {
    setLoading(true)
    setError(null)
    try {
      let query = supabase.from(table).select(options.select || '*')

      if (options.eq) {
        Object.entries(options.eq).forEach(([col, val]) => { query = query.eq(col, val) })
      }
      if (extraOptions.eq) {
        Object.entries(extraOptions.eq).forEach(([col, val]) => { query = query.eq(col, val) })
      }
      if (options.order) {
        query = query.order(options.order.column, { ascending: options.order.ascending ?? true })
      }
      if (options.limit) {
        query = query.limit(options.limit)
      }

      const { data: result, error: err } = await query
      if (err) throw err
      setData(result || [])
      return result
    } catch (err) {
      setError(err.message)
      return []
    } finally {
      setLoading(false)
    }
  }, [table, JSON.stringify(options)])

  return { data, loading, error, fetch, setData }
}

export function useSupabaseMutation(table) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const insert = useCallback(async (payload) => {
    setLoading(true)
    setError(null)
    try {
      const { data, error } = await supabase.from(table).insert([payload]).select()
      if (error) throw error
      return data?.[0]
    } catch (err) {
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [table])

  const update = useCallback(async (id, payload) => {
    setLoading(true)
    setError(null)
    try {
      const { data, error } = await supabase.from(table).update(payload).eq('id', id).select()
      if (error) throw error
      return data?.[0]
    } catch (err) {
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [table])

  const remove = useCallback(async (id) => {
    setLoading(true)
    setError(null)
    try {
      const { error } = await supabase.from(table).delete().eq('id', id)
      if (error) throw error
    } catch (err) {
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [table])

  return { insert, update, remove, loading, error }
}
