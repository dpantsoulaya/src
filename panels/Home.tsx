import { FC, useEffect, useState } from "react";
import {
  Panel,
  PanelHeader,
  NavIdProps,
  Title,
  Button,
  ButtonGroup,
  Card,
  List,
  Cell,
  Input,
  FormItem,
  FormLayoutGroup,
  Footer,
  Group,
  Placeholder,
  PopoutWrapper,
  Subhead,
  Snackbar,
  CardGrid,
  FixedLayout,
  Caption,
  Div,
} from "@vkontakte/vkui";

import "./home.css";
import { Icon28ErrorCircleOutline } from "@vkontakte/icons";

export interface HomeProps extends NavIdProps {
  words: string[];
}

export const Home: FC<HomeProps> = ({ id, words }) => {
  // Кол-во букв в русском языке
  const NUM_OF_LETTERS = 33;

  const allWords = words;
  const [bigWord, setBigWord] = useState("");
  const [bigWordDecomposition, setBigWordDecomposition] = useState(new Array(NUM_OF_LETTERS));
  const [errorSnackbar, setErrorSnackbar] = useState<any | null>(null);
  const [input, setInput] = useState("");
  const [userWords, setUserWords] = useState<string[]>([]);
  const [hintsCount, setHintsCount] = useState(0);
  const [bigWordInput, setBigWordInput] = useState("");

  // При загрузке страницы сразу отображать новое слово
  useEffect(() => {
    btnNewWordClicked();
  }, [words]);

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

  //---------- Попаут для ввода нового большого слова ----------
  const popoutChangeBigWord = () => {
    const text = bigWordInput.trim().toUpperCase();

    if (text == null || text == "") {
      showError("Слово-то введите");
      return;
    }

    if (text.length > 30) {
      showError("Слово не должно быть больше 30 символов");
      return;
    }

    if (!containsOnlyLetters(text)) {
      showError("Слово должно содержать только русские буквы");
      return;
    }

    setBigWord(text);
    setBigWordDecomposition(createDecomposition(text));
    setBigWordInput("");
    setInput("");
    setUserWords([]);
    setOpenedBigWordPopuot(false);
  };
  const popoutCancel = () => {
    setOpenedBigWordPopuot(false);
  };

  const [openedBigWordPopuot, setOpenedBigWordPopuot] = useState(false);
  const bigWordPopout = openedBigWordPopuot ? (
    <PopoutWrapper>
      <Group>
        <Card style={{ padding: "30px" }}>
          <Title level="3">Задайте своё слово, из которого будут составляться слова</Title>
          <Subhead>Допустимо использовать только буквы русского языка</Subhead>
          <FormItem>
            <Input
              value={bigWordInput}
              onChange={(event) => setBigWordInput(event.target.value)}
              placeholder="Введите слово"
            />
          </FormItem>
          <FormItem>
            <ButtonGroup>
              <Button onClick={popoutCancel}>Отмена</Button>
              <Button onClick={popoutChangeBigWord}>Ок</Button>
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

  // Обработка нажатия кнопки "Новое слово"
  const btnNewWordClicked = () => {
    if (allWords.length == 0) return;

    const w = nextBigWord().toUpperCase();
    if (w != undefined && w != null && w != "") {
      setBigWord(w);
      setBigWordDecomposition(createDecomposition(w));
      setInput("");
      setUserWords([]);
    } else {
      showError("Не удалось получить слово");
    }
  };

  function containsOnlyLetters(text: string): boolean {
    return /^[А-ЯЁ]+$/.test(text);
  }

  // Нажатие кнопки "Подсказка"
  const btnHintClicked = () => {
    const exclude = [...userWords, bigWord];

    const w = allWords
      .filter((word) => word.length <= bigWord.length)
      .filter((word) => exclude.indexOf(word) < 0)
      .filter((word) => canBeMadeOf(word))
      .sort((a, b) => b.length - a.length)[0];

    if (w != undefined) {
      setUserWords((prev) => [w, ...prev]);
      setHintsCount((prev) => prev + 1);
    } else {
      showError("Не могу придумать никакого слова");
    }
  };

  // Добавление пользователем слова
  const btnAddWordClicked = (text: string) => {
    if (text == null || text == "") {
      showError("Слово-то введите");
      return;
    }

    text = text.trim().toUpperCase();
    if (!containsOnlyLetters(text)) {
      showError("Слово должно содержать только русские буквы");
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

    setInput("");
    setUserWords((prev) => [text, ...prev]);
  };

  // Задание своего большого слова
  const btnSetBigWordClicked = () => {
    setOpenedBigWordPopuot(true);
  };

  return (
    <Panel id={id}>
      <PanelHeader>Слова из слова</PanelHeader>

      <Card mode="shadow" style={{ margin: "10px" }}>
        <Div>
          <Title level="1" className="bigWord">
            {bigWord}
          </Title>
        </Div>
      </Card>

      <Card mode="shadow" style={{ margin: "10px" }}>
        <Div>
          <Div style={{ textAlign: "center" }}>
            <ButtonGroup>
              <Button onClick={btnHintClicked}>Подсказка</Button>
              <Button onClick={btnNewWordClicked}>Новое слово</Button>
              <Button onClick={btnSetBigWordClicked}>Задать своё слово</Button>
            </ButtonGroup>
          </Div>

          <FormLayoutGroup mode="horizontal">
            <FormItem>
              <Input
                placeholder="Введите слово"
                required
                value={input}
                onInput={(e) => setInput((e.target as HTMLInputElement).value)}></Input>
            </FormItem>

            <FormItem>
              <Button onClick={() => btnAddWordClicked(input)}>Добавить</Button>
            </FormItem>
          </FormLayoutGroup>
        </Div>
      </Card>

      <Card mode="shadow" style={{ height: "45vh", overflowY: "auto", margin: "10px" }}>
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

      <FixedLayout vertical="bottom">
        <Footer>
          Найдено слов: {userWords.length}, использовано подсказок: {hintsCount}
        </Footer>
      </FixedLayout>

      {bigWordPopout}

      {errorSnackbar}
    </Panel>
  );
};
