export interface OkResult<ResultValue> {
  ok: true;
  value: ResultValue;
}

export interface ErrorResult<ResultError extends Error> {
  ok: false;
  error: ResultError;
}

export type Result<Value, ResultError extends Error = Error> =
  | OkResult<Value>
  | ErrorResult<ResultError>;

export const numDimensions = 2;

/**
 * Used to define ping-pong state updates.
 */
export type AOrB = 'a' | 'b';
