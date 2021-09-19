type ResultType = "success" | "failure";

interface BaseResult {
  name: ResultType;
}

interface Success<T> extends BaseResult {
  name: "success";
  value: T;
}

interface Failure extends BaseResult {
  name: "failure";
  message: string;
}

export type Result<T> = Success<T> | Failure;

export const success = <T>(value: T): Success<T> => ({
  name: "success",
  value,
});
export const failure = (message: string): Failure => ({
  name: "failure",
  message,
});

export const isSuccess = <T>(result: Result<T>): result is Success<T> =>
  result.name === "success";
export const isFailure = <T>(result: Result<T>): result is Failure =>
  result.name === "failure";

export const map = <T, Z>(f: (v: T) => Z, result: Result<T>): Result<Z> =>
  isFailure(result) ? result : success(f(result.value));
