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
