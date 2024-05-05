import { useState, useEffect, ReactNode } from "react";
import { View, SplitLayout, SplitCol, ScreenSpinner } from "@vkontakte/vkui";
import { useActiveVkuiLocation } from "@vkontakte/vk-mini-apps-router";

import { Home } from "./panels";
import { DEFAULT_VIEW_PANELS } from "./routes";

import wordsFile from "./assets/words.txt";

export const App = () => {
  const { panel: activePanel = DEFAULT_VIEW_PANELS.HOME } = useActiveVkuiLocation();
  const [popout, setPopout] = useState<ReactNode | null>(<ScreenSpinner size="large" />);
  const [words, setWords] = useState<string[]>([]);

  useEffect(() => {
    async function fetchData() {
      fetch(wordsFile)
        .then((r) => r.text())
        .then((text) => {
          setWords(text.split("\r\n").map((w) => w.toUpperCase()));

          setPopout(null);
        });
    }
    fetchData();
  }, []);

  return (
    <SplitLayout popout={popout}>
      <SplitCol>
        <View activePanel={activePanel}>
          <Home id="home" words={words} />
        </View>
      </SplitCol>
    </SplitLayout>
  );
};
