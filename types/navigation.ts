export type MainTabParamList = {
  Announcements: undefined
  Publish: undefined
  Messages: undefined
  Profile: undefined
}

export type RootStackParamList = {
  Welcome: undefined
  Auth: undefined
  Main: undefined
  ColiSpace: { coliSpaceId: string }
  AnnouncementDetails: { announcementId: string }
  CreateAnnouncementChoice: undefined
  CreateGPAnnouncement: undefined
  CreateSenderAnnouncement: undefined
}
