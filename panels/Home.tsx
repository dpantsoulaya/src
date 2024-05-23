import { Dispatch, FC, ReactNode, SetStateAction, useEffect, useState } from "react";
import {
  Panel,
  NavIdProps,
  Title,
  Button,
  ButtonGroup,
  Card,
  List,
  Cell,
  Input,
  FormItem,
  Footer,
  Group,
  Placeholder,
  PopoutWrapper,
  Subhead,
  Snackbar,
  FixedLayout,
  Div,
  IconButton,
  Tooltip,
  SplitLayout,
  SplitCol,
  Alert,
} from "@vkontakte/vkui";

import "./home.css";
import {
  Icon20ErrorCircleFillYellow,
  Icon28AddCircleFillBlue,
  Icon28EditCircleFillBlue,
  Icon28ErrorCircleOutline,
  Icon28LightbulbCircleFillYellow,
  Icon28TextLiveCircleFillGreen,
} from "@vkontakte/icons";
import bridge, { EAdsFormats } from "@vkontakte/vk-bridge";

export interface HomeProps extends NavIdProps {
  words: string[];
  setPopout: Dispatch<SetStateAction<ReactNode | null>>;
}

export const Home: FC<HomeProps> = ({ id, words, setPopout }) => {
  // Кол-во букв в русском языке
  const NUM_OF_LETTERS = 33;

  const STORAGE_KEY_BIGWORD = "big_word";
  const STORAGE_KEY_WORDS = "words";

  const allWords = words;
  const [bigWord, setBigWord] = useState("");
  const [bigWordDecomposition, setBigWordDecomposition] = useState(new Array(NUM_OF_LETTERS));
  const [errorSnackbar, setErrorSnackbar] = useState<ReactNode | null>(null);
  const [input, setInput] = useState("");
  const [userWords, setUserWords] = useState<string[]>([]);
  const [hintsCount, setHintsCount] = useState(0);
  const [bigWordInput, setBigWordInput] = useState("");

  /*************************
   * Загрузка страницы
   ************************/
  useEffect(() => {
    bridge.send("VKWebAppInit");

    // Загрузить большое слово и придуманные пользователем слова
    bridge.send("VKWebAppStorageGet", { keys: [STORAGE_KEY_BIGWORD, STORAGE_KEY_WORDS] }).then((data) => {
      //debugger;
      if (data.keys) {
        // Значения получены
        const readBigWord = data.keys.filter((k) => k.key === STORAGE_KEY_BIGWORD)[0].value;
        const readUserWords = data.keys.filter((k) => k.key === STORAGE_KEY_WORDS)[0].value;

        if (readBigWord !== "") {
          setBigWord(readBigWord);
          setBigWordDecomposition(createDecomposition(readBigWord));
          setUserWords(JSON.parse(readUserWords));
        } else {
          setNewBigWord();
        }
      } else {
        setNewBigWord();
      }
    });
  }, [words]);

  /*********************************************
   * Закрыть всплывающее окно
   *********************************************/
  const closePopout = () => {
    setPopout(null);
  };

  const showError = (text: string) => {
    if (errorSnackbar) return;

    setErrorSnackbar(
      <Snackbar
        onClose={() => setErrorSnackbar(null)}
        before={<Icon28ErrorCircleOutline fill="var(--vkui--color_icon_negative)" />}>
        {text}
      </Snackbar>
    );
  };

  /*************************************************
   * Попаут для ввода нового большого слова
   **************************************************/
  const popoutChangeBigWord = () => {
    const text = bigWordInput.trim().toUpperCase();

    if (text == null || text == "") {
      showError("Слово-то введите");
      return;
    }

    if (text.length < 5) {
      showError("Слово должно быть не менее 5 символов");
      return;
    }

    if (text.length > 30) {
      showError("Слово не должно превышать 30 символов");
      return;
    }

    if (!containsOnlyLetters(text)) {
      showError("Слово должно содержать только русские буквы");
      return;
    }

    // Сохранить значение в VkStorage
    bridge.send("VKWebAppStorageSet", {
      key: STORAGE_KEY_BIGWORD,
      value: text,
    });
    bridge.send("VKWebAppStorageSet", {
      key: STORAGE_KEY_WORDS,
      value: JSON.stringify([]),
    });

    setBigWord(text);
    setBigWordDecomposition(createDecomposition(text));
    setBigWordInput("");
    setInput("");
    setUserWords([]);
    setHintsCount(0);
    setOpenedBigWordPopuot(false);
  };
  const popoutCancel = () => {
    setOpenedBigWordPopuot(false);
  };

  const [openedBigWordPopuot, setOpenedBigWordPopuot] = useState(false);

  /**************************************************
   * Попаут для ввода своего большого слова
   ***************************************************/
  const bigWordPopout = openedBigWordPopuot ? (
    <PopoutWrapper style={{ zIndex: "9" }}>
      <Group>
        <Card style={{ padding: "30px" }}>
          <Title level="3">Задайте своё слово, из которого будут составляться слова</Title>
          <Subhead style={{ margin: "10px", color: "gray" }}>
            <div style={{ float: "left", marginRight: "20px" }}>
              <Icon20ErrorCircleFillYellow />
            </div>
            <div>
              Допустимо использовать только буквы русского языка.
              <br />
              Прогресс с текущим словом будет потерян.
            </div>
          </Subhead>
          <FormItem>
            <Input
              value={bigWordInput}
              onChange={(event) => setBigWordInput(event.target.value)}
              placeholder="Введите слово"
            />
          </FormItem>
          <FormItem>
            <ButtonGroup>
              <Button appearance="neutral" onClick={popoutCancel}>
                Отмена
              </Button>
              <Button appearance="accent" onClick={popoutChangeBigWord}>
                Ок
              </Button>
            </ButtonGroup>
          </FormItem>
        </Card>
      </Group>
    </PopoutWrapper>
  ) : null;
  // --------------------------------------------------------------

  // Получить следующее большое слово случайным образом не меньше указанной длины
  const nextBigWord = () => {
    if (allWords.length == 0) return "";

    const onlyBigOnes = allWords.filter((w) => w.length > 15);
    return onlyBigOnes[Math.floor(Math.random() * onlyBigOnes.length)];
  };

  // Создать декомпозицию слова: количество букв
  const createDecomposition = (word: string): number[] => {
    word = word.toUpperCase();

    const decomposition = new Array(NUM_OF_LETTERS);

    for (let i = 0; i < NUM_OF_LETTERS; i++) {
      decomposition[i] = 0;
    }

    word.split("").forEach((letter) => {
      if (letter == "Ё") {
        decomposition[NUM_OF_LETTERS - 1]++;
      } else if (letter != "-") {
        const letterIndex = letter.charCodeAt(0) - "А".charCodeAt(0);
        decomposition[letterIndex]++;
      }
    });

    return decomposition;
  };

  // Может ли слово word быть создано из bigWord
  const canBeMadeOf = (word: string): boolean => {
    word = word.toUpperCase();
    const newDecomposition = createDecomposition(word);
    return newDecomposition.filter((l, i) => l > bigWordDecomposition[i]).length == 0;
  };

  /*********************************************
   * Рестарт
   *********************************************/
  const restart = () => {
    // Проверка к готовности рекламы к показу.
    bridge.send("VKWebAppCheckNativeAds", { ad_format: EAdsFormats.INTERSTITIAL });

    setPopout(
      <Alert
        actions={[
          {
            title: "Новое слово",
            mode: "destructive",
            action: () => {
              // показать рекламу
              try {
                bridge
                  .send("VKWebAppShowNativeAds", { ad_format: EAdsFormats.INTERSTITIAL })
                  .then(() => {})
                  .catch((error) => {
                    console.log(error); /* Ошибка */
                  })
                  .finally(() => {
                    setNewBigWord();
                  });
              } catch (exception) {
                console.log(exception);
                setNewBigWord();
              }
            },
          },
          {
            title: "Отмена",
            mode: "cancel",
          },
        ]}
        onClose={closePopout}
        actionsAlign="left"
        actionsLayout="horizontal"
        header="Начать с новым словом?"
        text="Весь текущий прогресс будет потерян. Вы уверены, что хотите начать новую игру?"
      />
    );

    return;
  };

  /*****************************************
   * Обработка нажатия кнопки "Новое слово"
   ******************************************/
  const setNewBigWord = () => {
    if (allWords.length == 0) return;

    const w = nextBigWord().toUpperCase();
    if (w != undefined && w != null && w != "") {
      // Сохранить большое слово в VkStorage
      bridge.send("VKWebAppStorageSet", {
        key: STORAGE_KEY_BIGWORD,
        value: w,
      });
      bridge.send("VKWebAppStorageSet", {
        key: STORAGE_KEY_WORDS,
        value: JSON.stringify([]),
      });

      setBigWord(w);
      setBigWordDecomposition(createDecomposition(w));
      setInput("");
      setUserWords([]);
      setHintsCount(0);
    } else {
      showError("Не удалось получить слово");
    }
  };

  function containsOnlyLetters(text: string): boolean {
    return /^[А-ЯЁ]+$/.test(text);
  }

  /****************************************
   * Нажатие кнопки "Подсказка"
   *****************************************/
  const btnHintClicked = () => {
    const exclude = [...userWords, bigWord];

    const w = allWords
      .filter((word) => word.length <= bigWord.length)
      .filter((word) => exclude.indexOf(word) < 0)
      .filter((word) => canBeMadeOf(word))
      .sort((a, b) => b.length - a.length)[0];

    if (w != undefined) {
      // Добавить слово в VkStorage
      bridge.send("VKWebAppStorageSet", {
        key: STORAGE_KEY_WORDS,
        value: JSON.stringify([w, ...userWords]),
      });

      setUserWords((prev) => [w, ...prev]);
      setHintsCount((prev) => prev + 1);
    } else {
      showError("Не могу придумать никакого слова");
    }
  };

  /************************************
   * Добавление пользователем слова
   **************************************/
  const btnAddWordClicked = (text: string) => {
    if (text == null || text == "") {
      showError("Слово-то введите");
      return;
    }

    text = text.trim().toUpperCase();
    if (!containsOnlyLetters(text)) {
      showError("Введены недопустимые символы, допустимы только русские буквы");
      return;
    }

    // Проверить, что такое слово уже было
    if (userWords.includes(text)) {
      showError("Это слово уже было");
      return;
    }

    // Проверить, что слово text может быть создано из большого слова
    if (!canBeMadeOf(text)) {
      showError(`Из слова ${bigWord} нельзя создать ${text}`);
      return;
    }

    // Проверить, что такое слово вообще есть
    if (allWords.filter((w) => w === text).length == 0) {
      showError("Нет такого слова");
      return;
    }

    // Сохранить это слово в VKStorage
    bridge.send("VKWebAppStorageSet", {
      key: STORAGE_KEY_WORDS,
      value: JSON.stringify([text, ...userWords]),
    });

    setInput("");
    setUserWords((prev) => [text, ...prev]);
  };

  // Задание своего большого слова
  const btnSetBigWordClicked = () => {
    setOpenedBigWordPopuot(true);
  };

  return (
    <Panel id={id}>
      <Card mode="shadow" style={{ margin: "10px" }}>
        <Div>
          <Title level="1" className="bigWord">
            {bigWord}
          </Title>
        </Div>
      </Card>

      <Card mode="shadow" style={{ margin: "10px" }}>
        <Div>
          <Div className="desktopControls">
            <ButtonGroup>
              <Button onClick={btnHintClicked}>Подсказка</Button>
              <Button onClick={restart}>Новое слово</Button>
              <Button onClick={btnSetBigWordClicked}>Задать своё слово</Button>
            </ButtonGroup>
          </Div>

          <div className="enterWordDiv">
            <div className="enterWordInput">
              <Input
                placeholder="Введите слово"
                required
                value={input}
                onInput={(e) => setInput((e.target as HTMLInputElement).value)}></Input>
            </div>
            <div className="enterWordButton">
              <Tooltip placement="top" text="Добавить слово" hoverDelay={[100, 700]}>
                <IconButton
                  label="Добавить слово"
                  onClick={() => btnAddWordClicked(input)}
                  hasHover={false}
                  hasActive={false}>
                  <Icon28AddCircleFillBlue />
                </IconButton>
              </Tooltip>
            </div>
          </div>
        </Div>
      </Card>

      <Card mode="shadow" className="foundWordsCard">
        {userWords.length == 0 ? (
          <Placeholder>Здесь будут те слова, которые вы придумаете</Placeholder>
        ) : (
          <List>
            {userWords.map((word) => (
              <Cell key={word}>{word}</Cell>
            ))}
          </List>
        )}
      </Card>

      <FixedLayout vertical="bottom" filled>
        <SplitLayout>
          <SplitCol style={{ textAlign: "center" }}>
            <ButtonGroup className="mobileControls" mode="horizontal">
              <IconButton onClick={btnHintClicked} className="mobileButton" label="Подсказка" hasHover={false}>
                <Icon28LightbulbCircleFillYellow />
              </IconButton>

              <IconButton onClick={restart} className="mobileButton" label="Новое слово" hasHover={false}>
                <Icon28TextLiveCircleFillGreen />
              </IconButton>

              <IconButton
                onClick={btnSetBigWordClicked}
                className="mobileButton"
                label="Задать своё слово"
                hasHover={false}>
                <Icon28EditCircleFillBlue />
              </IconButton>
            </ButtonGroup>
          </SplitCol>
        </SplitLayout>

        <Footer>
          Найдено слов: {userWords.length}, использовано подсказок: {hintsCount}
        </Footer>
      </FixedLayout>

      {bigWordPopout}

      {errorSnackbar}
    </Panel>
  );
};
