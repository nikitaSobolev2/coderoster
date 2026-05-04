import type {
  InCourseShellCodeImproveTrpcResult,
  InCourseShellExecutionTrpcResult,
  InCourseShellPlanAndAttemptResult,
  UseInCourseShellTrpcResult
} from './inCourseShellTrpcContracts'

export function mergeInCourseShellTrpcSlices(
  plan: InCourseShellPlanAndAttemptResult,
  improve: InCourseShellCodeImproveTrpcResult,
  exec: InCourseShellExecutionTrpcResult
): UseInCourseShellTrpcResult {
  return {
    viewerTier: plan.viewerTier,
    attemptIsSuccess: plan.attemptIsSuccess,
    utils: improve.utils,
    aiLessonUnlocked: improve.aiLessonUnlocked,
    liveAiJob: improve.liveAiJob,
    qLatestPy: improve.qLatestPy,
    qLatestPhp: improve.qLatestPhp,
    regenerateAiMutation: improve.regenerateAiMutation,
    startAiMutation: improve.startAiMutation,
    runMutation: exec.runMutation,
    completeMutation: exec.completeMutation
  }
}
