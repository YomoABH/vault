export type UUID = string
export type timestamp = number
export type rawMarkdown = string

export interface Ok<D> { readonly ok: true, readonly value: D }
export interface Err<E> { readonly ok: false, readonly error: E }
export type Result<D, E> = Ok<D> | Err<E>
export type AsyncResult<D, E> = Promise<Result<D, E>>

export const ok = <D>(value: D): Ok<D> => ({ ok: true, value })
export const err = <E>(error: E): Err<E> => ({ ok: false, error })
