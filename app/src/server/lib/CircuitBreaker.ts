/**
 * Minimal three-state circuit breaker (closed → open → half-open). Designed
 * for in-process use around side-effectful calls (RabbitMQ publish, outbound
 * HTTP). Not distributed; each process instance keeps its own counters.
 */

export interface CircuitBreakerOptions {
  failureThreshold: number
  cooldownMs: number
  name: string
}

type State = 'CLOSED' | 'OPEN' | 'HALF_OPEN'

export class CircuitBreakerOpenError extends Error {
  constructor(name: string) {
    super(`Circuit breaker open for ${name}`)
    this.name = 'CircuitBreakerOpenError'
  }
}

export class CircuitBreaker {
  private state: State = 'CLOSED'
  private failures = 0
  private nextAttemptAt = 0

  constructor(private readonly options: CircuitBreakerOptions) {}

  isOpen(): boolean {
    if (this.state !== 'OPEN') return false
    if (Date.now() >= this.nextAttemptAt) {
      this.state = 'HALF_OPEN'
      return false
    }
    return true
  }

  async run<T>(fn: () => Promise<T>): Promise<T> {
    if (this.isOpen()) {
      throw new CircuitBreakerOpenError(this.options.name)
    }
    try {
      const result = await fn()
      this.onSuccess()
      return result
    } catch (error) {
      this.onFailure()
      throw error
    }
  }

  private onSuccess() {
    this.state = 'CLOSED'
    this.failures = 0
  }

  private onFailure() {
    this.failures += 1
    if (this.failures >= this.options.failureThreshold) {
      this.state = 'OPEN'
      this.nextAttemptAt = Date.now() + this.options.cooldownMs
      console.warn(
        `[circuit-breaker] ${this.options.name} OPEN after ${this.failures} consecutive failures`
      )
    }
  }
}
