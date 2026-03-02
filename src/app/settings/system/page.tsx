"use client";

import { useEffect, useMemo, useState } from "react";
import { RefreshCw, Save } from "lucide-react";
import { toast } from "@/lib/toast";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  PageConstructionSetting,
  pageSettingsAPI,
} from "@/lib/api";

type SettingGroupKey = "web-pages" | "landing-sections" | "admin-pages" | "other";

const GROUP_METADATA: Record<
  SettingGroupKey,
  { title: string; description: string }
> = {
  "web-pages": {
    title: "Web Pages",
    description: "Public website routes such as login, signup, products and dashboard.",
  },
  "landing-sections": {
    title: "Landing Sections",
    description: "Sections inside home page such as hero, services, gallery, testimonials, etc.",
  },
  "admin-pages": {
    title: "Admin Pages",
    description: "Admin routes under admin domain.",
  },
  other: {
    title: "Other",
    description: "Auto-discovered routes not matching preset groups.",
  },
};

const getSettingGroup = (path: string): SettingGroupKey => {
  if (path.startsWith("/_section/")) {
    return "landing-sections";
  }
  if (path.startsWith("/_admin")) {
    return "admin-pages";
  }
  if (!path.startsWith("/_")) {
    return "web-pages";
  }
  return "other";
};

const formatPathForDisplay = (path: string): string => {
  if (path.startsWith("/_section/")) {
    return `/#${path.replace("/_section/", "")}`;
  }

  if (path.startsWith("/_admin")) {
    const adminPath = path.replace("/_admin", "") || "/";
    return `admin.devikrupaelectricals.in${adminPath}`;
  }

  return `devikrupaelectricals.in${path}`;
};

const formatDateTime = (value: string): string =>
  new Date(value).toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  });

const getDraftMessages = (
  items: PageConstructionSetting[]
): Record<string, string> =>
  items.reduce<Record<string, string>>((accumulator, item) => {
    accumulator[item.id] = item.message ?? "";
    return accumulator;
  }, {});

export default function SystemSettingsPage() {
  const [settings, setSettings] = useState<PageConstructionSetting[]>([]);
  const [messageDrafts, setMessageDrafts] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [updatingRows, setUpdatingRows] = useState<Record<string, boolean>>({});

  const hasSettings = settings.length > 0;

  const setRowUpdating = (id: string, isUpdating: boolean) => {
    setUpdatingRows((previous) => ({
      ...previous,
      [id]: isUpdating,
    }));
  };

  const upsertSetting = (updatedSetting: PageConstructionSetting) => {
    setSettings((previous) =>
      previous.map((setting) =>
        setting.id === updatedSetting.id ? updatedSetting : setting
      )
    );
    setMessageDrafts((previous) => ({
      ...previous,
      [updatedSetting.id]: updatedSetting.message ?? "",
    }));
  };

  const loadSettings = async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      const data = await pageSettingsAPI.getAll();
      setSettings(data);
      setMessageDrafts(getDraftMessages(data));
    } catch (error) {
      console.error("Failed to load page settings", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const handleToggle = async (setting: PageConstructionSetting) => {
    const nextState = !setting.isUnderConstruction;

    setSettings((previous) =>
      previous.map((item) =>
        item.id === setting.id
          ? { ...item, isUnderConstruction: nextState }
          : item
      )
    );
    setRowUpdating(setting.id, true);

    try {
      const updatedSetting = await pageSettingsAPI.update(setting.id, {
        isUnderConstruction: nextState,
      });
      upsertSetting(updatedSetting);
      toast.success(
        nextState
          ? `${setting.label} is now under construction`
          : `${setting.label} is now live`
      );
    } catch {
      setSettings((previous) =>
        previous.map((item) =>
          item.id === setting.id
            ? { ...item, isUnderConstruction: setting.isUnderConstruction }
            : item
        )
      );
      toast.error("Failed to update page toggle");
    } finally {
      setRowUpdating(setting.id, false);
    }
  };

  const handleMessageSave = async (settingId: string) => {
    const setting = settings.find((item) => item.id === settingId);
    if (!setting) {
      return;
    }

    const draftMessage = (messageDrafts[settingId] ?? "").trim();

    setRowUpdating(settingId, true);
    try {
      const updatedSetting = await pageSettingsAPI.update(settingId, {
        message: draftMessage || null,
      });
      upsertSetting(updatedSetting);
      toast.success("Message saved");
    } catch {
      toast.error("Failed to save message");
    } finally {
      setRowUpdating(settingId, false);
    }
  };

  const statusSummary = useMemo(() => {
    const underConstructionCount = settings.filter(
      (setting) => setting.isUnderConstruction
    ).length;

    return {
      underConstructionCount,
      liveCount: settings.length - underConstructionCount,
    };
  }, [settings]);

  const groupedSettings = useMemo(() => {
    const groups: Record<SettingGroupKey, PageConstructionSetting[]> = {
      "web-pages": [],
      "landing-sections": [],
      "admin-pages": [],
      other: [],
    };

    for (const setting of settings) {
      groups[getSettingGroup(setting.path)].push(setting);
    }

    return groups;
  }, [settings]);

  if (loading) {
    return (
      <div className="p-4 md:p-6">
        <p className="text-sm text-muted-foreground">Loading system settings...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Page Construction Control</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Toggle any page to show an under-construction screen. Each path is managed independently.
          </p>
          <p className="mt-2 text-xs text-muted-foreground">
            Live: {statusSummary.liveCount} | Under Construction: {statusSummary.underConstructionCount}
          </p>
        </div>

        <Button
          variant="outline"
          onClick={() => loadSettings(true)}
          disabled={refreshing}
        >
          <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
          Refresh Paths
        </Button>
      </div>

      {!hasSettings && (
        <div className="rounded-xl border border-dashed p-6 text-sm text-muted-foreground">
          No pages discovered yet.
        </div>
      )}

      <div className="space-y-8">
        {(Object.keys(GROUP_METADATA) as SettingGroupKey[]).map((groupKey) => {
          const items = groupedSettings[groupKey];
          if (items.length === 0) {
            return null;
          }

          const groupMeta = GROUP_METADATA[groupKey];

          return (
            <section key={groupKey} className="space-y-4">
              <div>
                <h2 className="text-lg font-semibold">{groupMeta.title}</h2>
                <p className="text-sm text-muted-foreground">
                  {groupMeta.description}
                </p>
              </div>

              <div className="space-y-4">
                {items.map((setting) => {
                  const isUpdating = !!updatingRows[setting.id];
                  const isMessageUnchanged =
                    (messageDrafts[setting.id] ?? "").trim() ===
                    (setting.message ?? "");

                  return (
                    <div
                      key={setting.id}
                      className="rounded-2xl border bg-[var(--card)] p-4 md:p-5"
                    >
                      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                        <div className="space-y-1">
                          <h3 className="text-base font-semibold">{setting.label}</h3>
                          <p className="text-sm text-muted-foreground">
                            {formatPathForDisplay(setting.path)}
                          </p>
                        </div>

                        <div className="flex items-center gap-3">
                          <Badge
                            className={
                              setting.isUnderConstruction
                                ? "border-[#8b5e1f] bg-[#fff4dc] text-[#8b5e1f]"
                                : "border-[#0e5f39] bg-[#dbf6e8] text-[#0e5f39]"
                            }
                          >
                            {setting.isUnderConstruction ? "Under Construction" : "Live"}
                          </Badge>

                          <Switch
                            checked={setting.isUnderConstruction}
                            onCheckedChange={() => handleToggle(setting)}
                            disabled={isUpdating}
                            aria-label={`Toggle ${setting.path}`}
                          />
                        </div>
                      </div>

                      <div className="mt-4 grid gap-2 md:grid-cols-[1fr_auto]">
                        <Input
                          value={messageDrafts[setting.id] ?? ""}
                          onChange={(event) =>
                            setMessageDrafts((previous) => ({
                              ...previous,
                              [setting.id]: event.target.value,
                            }))
                          }
                          placeholder="Optional message shown on construction screen"
                          disabled={isUpdating}
                        />
                        <Button
                          variant="outline"
                          onClick={() => handleMessageSave(setting.id)}
                          disabled={isUpdating || isMessageUnchanged}
                        >
                          <Save className="mr-2 h-4 w-4" />
                          Save Message
                        </Button>
                      </div>

                      <p className="mt-2 text-xs text-muted-foreground">
                        Last updated: {formatDateTime(setting.updatedAt)}
                      </p>
                    </div>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}

