delete window.$;

// Get Discord's internal webpack modules
const wpRequire = webpackChunkdiscord_app.push([[Symbol()], {}, (r) => r]);
webpackChunkdiscord_app.pop();

// Cache webpack modules for better performance
const webpackModules = Object.values(wpRequire.c);

// Find required Discord stores and APIs
const ApplicationStreamingStore = webpackModules.find(
  (x) => x?.exports?.Z?.__proto__?.getStreamerActiveStreamMetadata
)?.exports.Z;
const RunningGameStore = webpackModules.find(
  (x) => x?.exports?.ZP?.getRunningGames
)?.exports.ZP;
const QuestsStore = webpackModules.find(
  (x) => x?.exports?.Z?.__proto__?.getQuest
)?.exports.Z;
const ChannelStore = webpackModules.find(
  (x) => x?.exports?.Z?.__proto__?.getAllThreadsForParent
)?.exports.Z;
const GuildChannelStore = webpackModules.find(
  (x) => x?.exports?.ZP?.getSFWDefaultChannel
)?.exports.ZP;
const FluxDispatcher = webpackModules.find(
  (x) => x?.exports?.Z?.__proto__?.flushWaitQueue
)?.exports.Z;
const api = webpackModules.find((x) => x?.exports?.tn?.get)?.exports.tn;

// Find all active, incomplete quests
const activeQuests = [...QuestsStore.quests.values()].filter(
  (quest) =>
    quest.id !== "1412491570820812933" && // Skip specific quest
    quest.userStatus?.enrolledAt && // User is enrolled
    !quest.userStatus?.completedAt && // Not completed yet
    new Date(quest.config.expiresAt).getTime() > Date.now() // Not expired
);

const isDesktopApp = typeof DiscordNative !== "undefined";

if (activeQuests.length === 0) {
  console.log("🔍 No active quests found to complete!");
} else {
  console.log(
    `📋 Found ${activeQuests.length} active quests. Starting queue...`
  );

  // Quest completion queue
  let currentQuestIndex = 0;

  const processNextQuest = async () => {
    if (currentQuestIndex >= activeQuests.length) {
      console.log("🎉 All quests completed! Queue finished.");
      return;
    }

    const activeQuest = activeQuests[currentQuestIndex];
    console.log(
      `\n🚀 Processing quest ${currentQuestIndex + 1}/${activeQuests.length}`
    );

    await processQuest(activeQuest);

    currentQuestIndex++;
    // Process next quest after a short delay
    setTimeout(processNextQuest, 2000);
  };

  // Function to process a single quest
  const processQuest = async (activeQuest) => {
    // Generate random process ID for spoofing
    const fakeProcessId = Math.floor(Math.random() * 30000) + 1000;

    // Extract quest information
    const {
      config: {
        application: { id: applicationId, name: applicationName },
        messages: { questName },
        taskConfig = activeQuest.config.taskConfigV2,
      },
      userStatus,
    } = activeQuest;

    // Determine task type and requirements
    const supportedTasks = [
      "WATCH_VIDEO",
      "PLAY_ON_DESKTOP",
      "STREAM_ON_DESKTOP",
      "PLAY_ACTIVITY",
      "WATCH_VIDEO_ON_MOBILE",
    ];
    const taskType = supportedTasks.find(
      (task) => taskConfig.tasks[task] != null
    );
    const secondsRequired = taskConfig.tasks[taskType].target;
    let secondsCompleted = userStatus?.progress?.[taskType]?.value ?? 0;

    console.log(`📝 Quest: ${questName} (${applicationName})`);
    console.log(
      `🎯 Task: ${taskType} - ${secondsCompleted}/${secondsRequired} seconds`
    );

    return new Promise((resolve) => {
      // Handle video watching quests
      if (taskType === "WATCH_VIDEO" || taskType === "WATCH_VIDEO_ON_MOBILE") {
        const VIDEO_CONFIG = {
          maxFutureSeconds: 10, // Max seconds ahead we can report
          progressSpeed: 7, // Seconds to add per update (original speed)
          updateInterval: 1, // Seconds between updates (original interval)
        };

        const enrollmentTime = new Date(
          activeQuest.userStatus.enrolledAt
        ).getTime();
        let isCompleted = false;

        const completeVideoQuest = async () => {
          console.log(`🎬 Starting video quest: ${questName}`);

          while (secondsCompleted < secondsRequired) {
            const maxAllowedProgress =
              Math.floor((Date.now() - enrollmentTime) / 1000) +
              VIDEO_CONFIG.maxFutureSeconds;
            const progressDifference = maxAllowedProgress - secondsCompleted;
            const nextTimestamp = secondsCompleted + VIDEO_CONFIG.progressSpeed;

            if (progressDifference >= VIDEO_CONFIG.progressSpeed) {
              const timestamp = Math.min(
                secondsRequired,
                nextTimestamp + Math.random()
              );

              try {
                const response = await api.post({
                  url: `/quests/${activeQuest.id}/video-progress`,
                  body: { timestamp },
                });

                isCompleted = response.body.completed_at != null;
                secondsCompleted = Math.min(secondsRequired, nextTimestamp);

                console.log(
                  `📹 Progress: ${secondsCompleted}/${secondsRequired} seconds`
                );
              } catch (error) {
                console.error("❌ Failed to update progress:", error);
              }
            }

            if (nextTimestamp >= secondsRequired) break;
            await new Promise((resolve) =>
              setTimeout(resolve, VIDEO_CONFIG.updateInterval * 1000)
            );
          }

          // Ensure completion
          if (!isCompleted) {
            await api.post({
              url: `/quests/${activeQuest.id}/video-progress`,
              body: { timestamp: secondsRequired },
            });
          }

          console.log("✅ Quest completed successfully!");
          resolve();
        };

        completeVideoQuest();
      } // Handle desktop game playing quests
      else if (taskType === "PLAY_ON_DESKTOP") {
        if (!isDesktopApp) {
          console.log(
            "⚠️  Desktop quests require the Discord desktop app. Browser version not supported for:",
            questName
          );
          resolve();
        } else {
          console.log(`🎮 Starting desktop game quest: ${questName}`);

          const setupGameQuest = async () => {
            try {
              const appDataResponse = await api.get({
                url: `/applications/public?application_ids=${applicationId}`,
              });
              const appData = appDataResponse.body[0];
              const executableName = appData.executables
                .find((exe) => exe.os === "win32")
                .name.replace(">", "");

              // Create fake game process
              const fakeGameProcess = {
                cmdLine: `C:\\Program Files\\${appData.name}\\${executableName}`,
                exeName: executableName,
                exePath: `c:/program files/${appData.name.toLowerCase()}/${executableName}`,
                hidden: false,
                isLauncher: false,
                id: applicationId,
                name: appData.name,
                pid: fakeProcessId,
                pidPath: [fakeProcessId],
                processName: appData.name,
                start: Date.now(),
              };

              // Backup original functions
              const originalGames = RunningGameStore.getRunningGames();
              const originalGetRunningGames = RunningGameStore.getRunningGames;
              const originalGetGameForPID = RunningGameStore.getGameForPID;

              // Override game detection functions
              RunningGameStore.getRunningGames = () => [fakeGameProcess];
              RunningGameStore.getGameForPID = (pid) =>
                pid === fakeProcessId ? fakeGameProcess : null;

              // Notify Discord of fake game
              FluxDispatcher.dispatch({
                type: "RUNNING_GAMES_CHANGE",
                removed: originalGames,
                added: [fakeGameProcess],
                games: [fakeGameProcess],
              });

              // Monitor quest progress
              const progressHandler = (data) => {
                const progress =
                  activeQuest.config.configVersion === 1
                    ? data.userStatus.streamProgressSeconds
                    : Math.floor(
                        data.userStatus.progress.PLAY_ON_DESKTOP.value
                      );

                console.log(
                  `🎮 Game progress: ${progress}/${secondsRequired} seconds`
                );

                if (progress >= secondsRequired) {
                  console.log("✅ Quest completed successfully!");

                  // Restore original functions
                  RunningGameStore.getRunningGames = originalGetRunningGames;
                  RunningGameStore.getGameForPID = originalGetGameForPID;
                  FluxDispatcher.dispatch({
                    type: "RUNNING_GAMES_CHANGE",
                    removed: [fakeGameProcess],
                    added: [],
                    games: [],
                  });
                  FluxDispatcher.unsubscribe(
                    "QUESTS_SEND_HEARTBEAT_SUCCESS",
                    progressHandler
                  );
                  resolve();
                }
              };

              FluxDispatcher.subscribe(
                "QUESTS_SEND_HEARTBEAT_SUCCESS",
                progressHandler
              );

              const remainingMinutes = Math.ceil(
                (secondsRequired - secondsCompleted) / 60
              );
              console.log(
                `🎮 Spoofing ${applicationName}. Estimated completion: ${remainingMinutes} minutes`
              );
            } catch (error) {
              console.error("❌ Failed to setup game spoofing:", error);
              resolve();
            }
          };

          setupGameQuest();
        }
      } // Handle desktop streaming quests
      else if (taskType === "STREAM_ON_DESKTOP") {
        if (!isDesktopApp) {
          console.log(
            "⚠️  Streaming quests require the Discord desktop app. Browser version not supported for:",
            questName
          );
          resolve();
        } else {
          console.log(`📹 Starting streaming quest: ${questName}`);
          console.log(
            "⚠️  Remember: You need at least 1 other person in the voice channel!"
          );

          // Backup original function
          const originalStreamFunction =
            ApplicationStreamingStore.getStreamerActiveStreamMetadata;

          // Override streaming metadata
          ApplicationStreamingStore.getStreamerActiveStreamMetadata = () => ({
            id: applicationId,
            pid: fakeProcessId,
            sourceName: null,
          });

          // Monitor quest progress
          const progressHandler = (data) => {
            const progress =
              activeQuest.config.configVersion === 1
                ? data.userStatus.streamProgressSeconds
                : Math.floor(data.userStatus.progress.STREAM_ON_DESKTOP.value);

            console.log(
              `📹 Stream progress: ${progress}/${secondsRequired} seconds`
            );

            if (progress >= secondsRequired) {
              console.log("✅ Quest completed successfully!");

              // Restore original function
              ApplicationStreamingStore.getStreamerActiveStreamMetadata =
                originalStreamFunction;
              FluxDispatcher.unsubscribe(
                "QUESTS_SEND_HEARTBEAT_SUCCESS",
                progressHandler
              );
              resolve();
            }
          };

          FluxDispatcher.subscribe(
            "QUESTS_SEND_HEARTBEAT_SUCCESS",
            progressHandler
          );

          const remainingMinutes = Math.ceil(
            (secondsRequired - secondsCompleted) / 60
          );
          console.log(
            `📹 Spoofing stream for ${applicationName}. Estimated completion: ${remainingMinutes} minutes`
          );
        }
      } // Handle activity-based quests
      else if (taskType === "PLAY_ACTIVITY") {
        const channelId =
          ChannelStore.getSortedPrivateChannels()[0]?.id ??
          Object.values(GuildChannelStore.getAllGuilds()).find(
            (guild) => guild?.VOCAL?.length > 0
          )?.VOCAL[0]?.channel?.id;

        if (!channelId) {
          console.log(
            "❌ No suitable voice channel found. Join a voice channel first!"
          );
          resolve();
        } else {
          const streamKey = `call:${channelId}:1`;

          const completeActivityQuest = async () => {
            console.log(`🎯 Starting activity quest: ${questName}`);

            try {
              while (secondsCompleted < secondsRequired) {
                const response = await api.post({
                  url: `/quests/${activeQuest.id}/heartbeat`,
                  body: { stream_key: streamKey, terminal: false },
                });

                secondsCompleted = response.body.progress.PLAY_ACTIVITY.value;
                console.log(
                  `🎯 Activity progress: ${secondsCompleted}/${secondsRequired} seconds`
                );

                if (secondsCompleted >= secondsRequired) {
                  // Send final completion heartbeat
                  await api.post({
                    url: `/quests/${activeQuest.id}/heartbeat`,
                    body: { stream_key: streamKey, terminal: true },
                  });
                  break;
                }

                // Wait 20 seconds between updates (original timing)
                await new Promise((resolve) => setTimeout(resolve, 20 * 1000));
              }

              console.log("✅ Quest completed successfully!");
              resolve();
            } catch (error) {
              console.error("❌ Failed to complete activity quest:", error);
              resolve();
            }
          };

          completeActivityQuest();
        }
      }

      // Unsupported quest type
      else {
        console.log(`❌ Unsupported quest type: ${taskType}`);
        console.log(
          "Supported types: WATCH_VIDEO, PLAY_ON_DESKTOP, STREAM_ON_DESKTOP, PLAY_ACTIVITY"
        );
        resolve();
      }
    });
  };

  // Start processing the quest queue
  processNextQuest();
}
