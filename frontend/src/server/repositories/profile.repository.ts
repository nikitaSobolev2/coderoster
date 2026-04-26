import type { ActivityCell, EarnedAchievement, PublicProfile } from './types'
import { getFakeAchievements, getFakeActivity, getFakeProfile } from './fixtures'
import { stubNotImplemented } from './stub'

export interface ProfileRepository {
  getByUsername(username: string, viewerUserId: string | null): Promise<PublicProfile | null>
  getActivity(username: string, year: number): Promise<ActivityCell[]>
  getAchievements(username: string): Promise<EarnedAchievement[]>
}

export class FakeProfileRepository implements ProfileRepository {
  async getByUsername(
    username: string,
    viewerUserId: string | null
  ): Promise<PublicProfile | null> {
    const profile = getFakeProfile(username)
    if (!profile) return null
    return { ...profile, isOwner: viewerUserId === profile.id }
  }

  async getActivity(_username: string, year: number): Promise<ActivityCell[]> {
    return getFakeActivity(year)
  }

  async getAchievements(username: string): Promise<EarnedAchievement[]> {
    return getFakeAchievements(username)
  }
}

export class PrismaProfileRepository implements ProfileRepository {
  getByUsername(): Promise<PublicProfile | null> {
    return stubNotImplemented('ProfileRepository.getByUsername')
  }

  getActivity(): Promise<ActivityCell[]> {
    return stubNotImplemented('ProfileRepository.getActivity')
  }

  getAchievements(): Promise<EarnedAchievement[]> {
    return stubNotImplemented('ProfileRepository.getAchievements')
  }
}
