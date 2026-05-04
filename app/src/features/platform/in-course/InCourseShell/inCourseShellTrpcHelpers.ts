export function trpcMutationMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Request failed'
}

export function ignoreRejectedQueryPromise(promise: Promise<unknown>): void {
  promise.catch(() => undefined)
}
