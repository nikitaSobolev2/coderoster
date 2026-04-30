package contracts

// Exchange and queue names match `app/src/server/amqp/connection.ts` and
// `infra/compose/rabbitmq/definitions.json`.
const (
	ExchangeName       = "coderoster.events"
	DeadLetterExchange = "coderoster.dlx"

	AICodeImproveTopic = "ai.code_improve.requested"
	AICodeImproveQueue = "ai.code_improve.requested"

	AICodeImproveDeadRoutingKey = "ai.code_improve.requested.dead"
)
