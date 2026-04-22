export type UUID = string
export type timestamp = number
export type rawMarkdown = string

export interface Ok<D> { readonly ok: true, readonly value: D }
export interface Err<E> { readonly ok: false, readonly error: E }
export type Result<D, E> = Ok<D> | Err<E>
export type AsyncResult<D, E> = Promise<Result<D, E>>

export const ok = <D>(value: D): Ok<D> => ({ ok: true, value })
export const err = <E>(error: E): Err<E> => ({ ok: false, error })

export type Rule<Value, Error = string> = (value: Value) => Error | null

export function validate<T, E = string>(value: T, rules: Rule<T, E>[]): E | null {
	for (const rule of rules) {
		const error = rule(value)
		if (error !== null)
			return error
	}
	return null
}
