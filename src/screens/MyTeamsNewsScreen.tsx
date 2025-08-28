import React from "react";
import NewsList from "../components/NewsList";

export default function MyTeamsNewsScreen() {
  // Пример: показывать новости по Red Bull и Ferrari
  const q = "Red Bull Ferrari";
  return <NewsList mode="balanced" q={q} />;
}
