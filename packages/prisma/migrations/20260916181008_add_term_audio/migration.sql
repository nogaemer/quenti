-- CreateTable
CREATE TABLE `Account` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `type` VARCHAR(191) NOT NULL,
    `provider` VARCHAR(191) NOT NULL,
    `providerAccountId` VARCHAR(191) NOT NULL,
    `refresh_token` TEXT NULL,
    `access_token` TEXT NULL,
    `expires_at` INTEGER NULL,
    `token_type` VARCHAR(191) NULL,
    `scope` VARCHAR(191) NULL,
    `id_token` TEXT NULL,
    `session_state` VARCHAR(191) NULL,

    INDEX `Account_userId_idx`(`userId`),
    UNIQUE INDEX `Account_provider_providerAccountId_key`(`provider`, `providerAccountId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Session` (
    `id` VARCHAR(191) NOT NULL,
    `sessionToken` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `expires` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Session_sessionToken_key`(`sessionToken`),
    INDEX `Session_userId_idx`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `User` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NULL,
    `username` VARCHAR(191) NULL,
    `email` VARCHAR(191) NOT NULL,
    `emailVerified` DATETIME(3) NULL,
    `image` VARCHAR(191) NULL,
    `type` ENUM('Student', 'Teacher') NOT NULL DEFAULT 'Student',
    `verified` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `lastSeenAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `bannedAt` DATETIME(3) NULL,
    `displayName` BOOLEAN NOT NULL DEFAULT true,
    `flags` INTEGER NOT NULL DEFAULT 0,
    `metadata` JSON NULL,
    `completedOnboarding` BOOLEAN NOT NULL DEFAULT false,
    `isOrgEligible` BOOLEAN NOT NULL DEFAULT false,
    `organizationId` VARCHAR(191) NULL,

    UNIQUE INDEX `User_username_key`(`username`),
    UNIQUE INDEX `User_email_key`(`email`),
    INDEX `User_organizationId_idx`(`organizationId`),
    INDEX `User_type_idx`(`type`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `VerificationToken` (
    `identifier` VARCHAR(191) NOT NULL,
    `token` VARCHAR(191) NOT NULL,
    `expires` DATETIME(3) NOT NULL,
    `expiresInDays` INTEGER NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `organizationId` VARCHAR(191) NULL,

    UNIQUE INDEX `VerificationToken_token_key`(`token`),
    UNIQUE INDEX `VerificationToken_organizationId_key`(`organizationId`),
    INDEX `VerificationToken_token_idx`(`token`),
    UNIQUE INDEX `VerificationToken_identifier_token_key`(`identifier`, `token`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Organization` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `logoUrl` VARCHAR(191) NULL,
    `logoHash` VARCHAR(191) NULL,
    `published` BOOLEAN NOT NULL DEFAULT false,
    `deletedAt` DATETIME(3) NULL,
    `metadata` JSON NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `OrganizationDomain` (
    `id` VARCHAR(191) NOT NULL,
    `orgId` VARCHAR(191) NOT NULL,
    `type` ENUM('Base', 'Student') NOT NULL,
    `requestedDomain` VARCHAR(191) NOT NULL,
    `domain` VARCHAR(191) NULL,
    `verifiedEmail` VARCHAR(191) NOT NULL,
    `otpHash` VARCHAR(191) NULL,
    `verifiedAt` DATETIME(3) NULL,
    `filter` VARCHAR(191) NULL,

    UNIQUE INDEX `OrganizationDomain_domain_key`(`domain`),
    INDEX `OrganizationDomain_orgId_idx`(`orgId`),
    UNIQUE INDEX `OrganizationDomain_orgId_type_key`(`orgId`, `type`),
    UNIQUE INDEX `OrganizationDomain_orgId_requestedDomain_key`(`orgId`, `requestedDomain`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `OrganizationMembership` (
    `id` VARCHAR(191) NOT NULL,
    `orgId` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `role` ENUM('Member', 'Admin', 'Owner') NOT NULL,
    `metadata` JSON NULL,

    UNIQUE INDEX `OrganizationMembership_userId_key`(`userId`),
    INDEX `OrganizationMembership_orgId_idx`(`orgId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PendingOrganizationInvite` (
    `id` VARCHAR(191) NOT NULL,
    `orgId` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NULL,
    `email` VARCHAR(191) NOT NULL,
    `role` ENUM('Member', 'Admin', 'Owner') NOT NULL,

    INDEX `PendingOrganizationInvite_email_idx`(`email`),
    INDEX `PendingOrganizationInvite_orgId_idx`(`orgId`),
    INDEX `PendingOrganizationInvite_userId_idx`(`userId`),
    UNIQUE INDEX `PendingOrganizationInvite_orgId_email_key`(`orgId`, `email`),
    UNIQUE INDEX `PendingOrganizationInvite_orgId_userId_key`(`orgId`, `userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Class` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NOT NULL,
    `orgId` VARCHAR(191) NULL,
    `logoUrl` VARCHAR(191) NULL,
    `logoHash` VARCHAR(191) NULL,
    `bannerColor` VARCHAR(191) NOT NULL DEFAULT '#ffa54c',
    `bannerUrl` VARCHAR(191) NULL,
    `bannerHash` VARCHAR(191) NULL,
    `cortexCategory` VARCHAR(191) NULL,
    `cortexCourse` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `Class_orgId_idx`(`orgId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Section` (
    `id` VARCHAR(191) NOT NULL,
    `classId` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `Section_classId_idx`(`classId`),
    UNIQUE INDEX `Section_classId_name_key`(`classId`, `name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ClassJoinCode` (
    `id` VARCHAR(191) NOT NULL,
    `classId` VARCHAR(191) NOT NULL,
    `sectionId` VARCHAR(191) NOT NULL,
    `code` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `ClassJoinCode_sectionId_key`(`sectionId`),
    UNIQUE INDEX `ClassJoinCode_code_key`(`code`),
    INDEX `ClassJoinCode_classId_idx`(`classId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ClassMembership` (
    `id` VARCHAR(191) NOT NULL,
    `classId` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `type` ENUM('Student', 'Teacher') NOT NULL,
    `viewedAt` DATETIME(3) NULL,
    `sectionId` VARCHAR(191) NULL,
    `deletedAt` DATETIME(3) NULL,

    INDEX `ClassMembership_classId_idx`(`classId`),
    INDEX `ClassMembership_userId_idx`(`userId`),
    INDEX `ClassMembership_sectionId_idx`(`sectionId`),
    UNIQUE INDEX `ClassMembership_classId_userId_key`(`classId`, `userId`),
    UNIQUE INDEX `ClassMembership_email_classId_key`(`email`, `classId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ClassBan` (
    `id` VARCHAR(191) NOT NULL,
    `classId` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NULL,
    `email` VARCHAR(191) NOT NULL,

    INDEX `ClassBan_classId_idx`(`classId`),
    INDEX `ClassBan_userId_idx`(`userId`),
    UNIQUE INDEX `ClassBan_classId_userId_key`(`classId`, `userId`),
    UNIQUE INDEX `ClassBan_email_classId_key`(`email`, `classId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PendingClassInvite` (
    `id` VARCHAR(191) NOT NULL,
    `classId` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NULL,
    `email` VARCHAR(191) NOT NULL,
    `type` ENUM('Student', 'Teacher') NOT NULL,
    `sectionId` VARCHAR(191) NULL,

    INDEX `PendingClassInvite_classId_idx`(`classId`),
    INDEX `PendingClassInvite_userId_idx`(`userId`),
    INDEX `PendingClassInvite_email_idx`(`email`),
    UNIQUE INDEX `PendingClassInvite_classId_email_key`(`classId`, `email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ClassPreferences` (
    `id` VARCHAR(191) NOT NULL,
    `membershipId` VARCHAR(191) NOT NULL,
    `bannerColor` VARCHAR(191) NULL,

    UNIQUE INDEX `ClassPreferences_membershipId_key`(`membershipId`),
    INDEX `ClassPreferences_membershipId_idx`(`membershipId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Assignment` (
    `id` VARCHAR(191) NOT NULL,
    `classId` VARCHAR(191) NOT NULL,
    `sectionId` VARCHAR(191) NOT NULL,
    `type` ENUM('Collab') NOT NULL,
    `title` VARCHAR(255) NOT NULL,
    `description` JSON NULL,
    `templateId` VARCHAR(191) NULL,
    `studySetId` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `availableAt` DATETIME(3) NOT NULL,
    `dueAt` DATETIME(3) NULL,
    `lockedAt` DATETIME(3) NULL,
    `published` BOOLEAN NOT NULL DEFAULT false,

    INDEX `Assignment_classId_idx`(`classId`),
    INDEX `Assignment_sectionId_idx`(`sectionId`),
    INDEX `Assignment_studySetId_idx`(`studySetId`),
    UNIQUE INDEX `Assignment_id_classId_key`(`id`, `classId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Submission` (
    `id` VARCHAR(191) NOT NULL,
    `memberId` VARCHAR(191) NOT NULL,
    `assignmentId` VARCHAR(191) NOT NULL,
    `startedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `savedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `submittedAt` DATETIME(3) NULL,

    INDEX `Submission_memberId_idx`(`memberId`),
    INDEX `Submission_assignmentId_idx`(`assignmentId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `WhitelistedEmail` (
    `email` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `WhitelistedEmail_email_key`(`email`),
    PRIMARY KEY (`email`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `StudySet` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `assignmentId` VARCHAR(191) NULL,
    `created` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `savedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `type` ENUM('Default', 'Collab') NOT NULL DEFAULT 'Default',
    `title` VARCHAR(255) NOT NULL,
    `description` VARCHAR(2000) NOT NULL,
    `tags` JSON NOT NULL,
    `visibility` ENUM('Private', 'Unlisted', 'Public', 'Class') NOT NULL DEFAULT 'Public',
    `wordLanguage` VARCHAR(191) NOT NULL DEFAULT 'en',
    `definitionLanguage` VARCHAR(191) NOT NULL DEFAULT 'en',
    `cortexStale` BOOLEAN NOT NULL DEFAULT true,

    UNIQUE INDEX `StudySet_assignmentId_key`(`assignmentId`),
    INDEX `StudySet_userId_idx`(`userId`),
    UNIQUE INDEX `StudySet_id_userId_key`(`id`, `userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `StudySetCollaborator` (
    `id` VARCHAR(191) NOT NULL,
    `studySetId` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `StudySetCollaborator_studySetId_idx`(`studySetId`),
    INDEX `StudySetCollaborator_userId_idx`(`userId`),
    UNIQUE INDEX `StudySetCollaborator_studySetId_userId_key`(`studySetId`, `userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `StudySetCollab` (
    `id` VARCHAR(191) NOT NULL,
    `studySetId` VARCHAR(191) NOT NULL,
    `type` ENUM('Default', 'Topic') NOT NULL,
    `minTermsPerUser` INTEGER NULL,
    `maxTermsPerUser` INTEGER NULL,

    UNIQUE INDEX `StudySetCollab_studySetId_key`(`studySetId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `StudySetCollabTopic` (
    `id` VARCHAR(191) NOT NULL,
    `collabId` VARCHAR(191) NOT NULL,
    `topic` VARCHAR(255) NOT NULL,
    `description` VARCHAR(2000) NULL,
    `rank` INTEGER NOT NULL,
    `minTerms` INTEGER NOT NULL,
    `maxTerms` INTEGER NOT NULL,

    INDEX `StudySetCollabTopic_collabId_idx`(`collabId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `StudySetCollabTopicAssignee` (
    `id` VARCHAR(191) NOT NULL,
    `topicId` VARCHAR(191) NOT NULL,
    `memberId` VARCHAR(191) NOT NULL,
    `minTerms` INTEGER NOT NULL,
    `maxTerms` INTEGER NOT NULL,

    INDEX `StudySetCollabTopicAssignee_memberId_idx`(`memberId`),
    UNIQUE INDEX `StudySetCollabTopicAssignee_topicId_memberId_key`(`topicId`, `memberId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AllowedClassesOnStudySets` (
    `studySetId` VARCHAR(191) NOT NULL,
    `classId` VARCHAR(191) NOT NULL,

    INDEX `AllowedClassesOnStudySets_studySetId_idx`(`studySetId`),
    INDEX `AllowedClassesOnStudySets_classId_idx`(`classId`),
    PRIMARY KEY (`studySetId`, `classId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AllowedSectionsOnStudySets` (
    `studySetId` VARCHAR(191) NOT NULL,
    `sectionId` VARCHAR(191) NOT NULL,

    INDEX `AllowedSectionsOnStudySets_studySetId_idx`(`studySetId`),
    INDEX `AllowedSectionsOnStudySets_sectionId_idx`(`sectionId`),
    PRIMARY KEY (`studySetId`, `sectionId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Folder` (
    `id` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `userId` VARCHAR(191) NOT NULL,
    `title` VARCHAR(255) NOT NULL,
    `slug` VARCHAR(191) NULL,
    `description` VARCHAR(2000) NOT NULL,

    UNIQUE INDEX `Folder_id_userId_key`(`id`, `userId`),
    UNIQUE INDEX `Folder_userId_slug_key`(`userId`, `slug`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `StudySetsOnFolders` (
    `studySetId` VARCHAR(191) NOT NULL,
    `folderId` VARCHAR(191) NOT NULL,

    INDEX `StudySetsOnFolders_studySetId_idx`(`studySetId`),
    INDEX `StudySetsOnFolders_folderId_idx`(`folderId`),
    PRIMARY KEY (`studySetId`, `folderId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `StudySetsOnClasses` (
    `studySetId` VARCHAR(191) NOT NULL,
    `classId` VARCHAR(191) NOT NULL,

    INDEX `StudySetsOnClasses_studySetId_idx`(`studySetId`),
    INDEX `StudySetsOnClasses_classId_idx`(`classId`),
    PRIMARY KEY (`studySetId`, `classId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `FoldersOnClasses` (
    `folderId` VARCHAR(191) NOT NULL,
    `classId` VARCHAR(191) NOT NULL,

    INDEX `FoldersOnClasses_folderId_idx`(`folderId`),
    INDEX `FoldersOnClasses_classId_idx`(`classId`),
    PRIMARY KEY (`folderId`, `classId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Term` (
    `id` VARCHAR(191) NOT NULL,
    `word` VARCHAR(1000) NOT NULL,
    `definition` VARCHAR(1000) NOT NULL,
    `wordRichText` JSON NULL,
    `definitionRichText` JSON NULL,
    `assetUrl` VARCHAR(255) NULL,
    `wordAudioUrl` VARCHAR(255) NULL,
    `definitionAudioUrl` VARCHAR(255) NULL,
    `exampleSentence` VARCHAR(500) NULL,
    `rank` INTEGER NOT NULL,
    `studySetId` VARCHAR(191) NOT NULL,
    `ephemeral` BOOLEAN NOT NULL DEFAULT false,
    `authorId` VARCHAR(191) NULL,
    `topicId` VARCHAR(191) NULL,
    `submissionId` VARCHAR(191) NULL,

    INDEX `Term_studySetId_idx`(`studySetId`),
    INDEX `Term_authorId_idx`(`authorId`),
    INDEX `Term_topicId_idx`(`topicId`),
    INDEX `Term_submissionId_idx`(`submissionId`),
    UNIQUE INDEX `Term_id_studySetId_key`(`id`, `studySetId`),
    UNIQUE INDEX `Term_id_submissionId_key`(`id`, `submissionId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Distractor` (
    `termId` CHAR(25) NOT NULL,
    `distractingId` CHAR(25) NOT NULL,
    `type` ENUM('Word', 'Definition') NOT NULL,

    INDEX `Distractor_termId_idx`(`termId`),
    UNIQUE INDEX `Distractor_termId_distractingId_type_key`(`termId`, `distractingId`, `type`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Leaderboard` (
    `id` VARCHAR(191) NOT NULL,
    `entityId` VARCHAR(191) NOT NULL,
    `type` ENUM('Match') NOT NULL,

    INDEX `Leaderboard_entityId_idx`(`entityId`),
    UNIQUE INDEX `Leaderboard_entityId_type_key`(`entityId`, `type`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Highscore` (
    `leaderboardId` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `time` INTEGER NOT NULL,
    `timestamp` DATETIME(3) NOT NULL,
    `eligible` BOOLEAN NOT NULL DEFAULT true,

    INDEX `Highscore_userId_idx`(`userId`),
    INDEX `Highscore_leaderboardId_idx`(`leaderboardId`),
    PRIMARY KEY (`leaderboardId`, `userId`, `eligible`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `EntityShare` (
    `id` VARCHAR(191) NOT NULL,
    `entityId` VARCHAR(191) NOT NULL,
    `type` ENUM('StudySet', 'Folder') NOT NULL,

    UNIQUE INDEX `EntityShare_entityId_key`(`entityId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Container` (
    `id` VARCHAR(191) NOT NULL,
    `entityId` VARCHAR(191) NOT NULL,
    `type` ENUM('StudySet', 'Folder') NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `viewedAt` DATETIME(3) NOT NULL,
    `shuffleFlashcards` BOOLEAN NOT NULL DEFAULT false,
    `learnRound` INTEGER NOT NULL DEFAULT 0,
    `learnMode` ENUM('Learn', 'Review') NOT NULL DEFAULT 'Learn',
    `shuffleLearn` BOOLEAN NOT NULL DEFAULT false,
    `studyStarred` BOOLEAN NOT NULL DEFAULT false,
    `answerWith` ENUM('Word', 'Definition', 'Both') NOT NULL DEFAULT 'Word',
    `multipleAnswerMode` ENUM('One', 'All', 'Unknown') NOT NULL DEFAULT 'Unknown',
    `extendedFeedbackBank` BOOLEAN NOT NULL DEFAULT false,
    `enableCardsSorting` BOOLEAN NOT NULL DEFAULT false,
    `cardsRound` INTEGER NOT NULL DEFAULT 0,
    `cardsStudyStarred` BOOLEAN NOT NULL DEFAULT false,
    `cardsAnswerWith` ENUM('Word', 'Definition') NOT NULL DEFAULT 'Definition',
    `matchStudyStarred` BOOLEAN NOT NULL DEFAULT false,

    INDEX `Container_entityId_idx`(`entityId`),
    UNIQUE INDEX `Container_userId_entityId_type_key`(`userId`, `entityId`, `type`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `StudiableTerm` (
    `userId` VARCHAR(191) NOT NULL,
    `termId` VARCHAR(191) NOT NULL,
    `containerId` VARCHAR(191) NOT NULL,
    `mode` ENUM('Flashcards', 'Learn') NOT NULL DEFAULT 'Learn',
    `correctness` INTEGER NOT NULL,
    `appearedInRound` INTEGER NULL,
    `incorrectCount` INTEGER NOT NULL DEFAULT 0,
    `studiableRank` INTEGER NULL,

    INDEX `StudiableTerm_containerId_idx`(`containerId`),
    PRIMARY KEY (`userId`, `containerId`, `termId`, `mode`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `StarredTerm` (
    `userId` VARCHAR(191) NOT NULL,
    `termId` VARCHAR(191) NOT NULL,
    `containerId` VARCHAR(191) NOT NULL,

    INDEX `StarredTerm_containerId_idx`(`containerId`),
    PRIMARY KEY (`userId`, `termId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
