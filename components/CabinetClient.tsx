"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Button } from "./Button";
import { Card } from "./Card";
import { CreatorNewsPanel } from "./CreatorNewsPanel";
import { CreatorPlayersPanel } from "./CreatorPlayersPanel";
import { CreatorLogsPanel } from "./CreatorLogsPanel";
import { CabinetDashboard } from "./CabinetDashboard";
import type { Dictionary } from "@/lib/dictionaries";
import type { Locale } from "@/lib/i18n";
import {
  canManageNews,
  canSearchPlayers,
  canViewAdminLogs,
  type SessionUser,
} from "@/lib/auth/types";
