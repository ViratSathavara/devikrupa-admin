"use client";

import { useEffect, useState } from "react";
import {
  DictionaryPhrase,
  DictionaryWord,
  TranslationRule,
  UnknownWord,
  translationAPI,
} from "@/lib/api";
import { getApiErrorMessage, toast } from "@/lib/toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, Trash2 } from "lucide-react";
import {
  AdminLoadingState,
  AdminPage,
  AdminPageHeader,
  AdminPanel,
} from "@/components/layouts/AdminPageShell";

type RuleForm = {
  name: string;
  sourceLang: "en" | "gu";
  targetLang: "en" | "gu";
  pattern: string;
  replacement: string;
  priority: string;
};

export default function LanguageManagerPage() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [words, setWords] = useState<DictionaryWord[]>([]);
  const [phrases, setPhrases] = useState<DictionaryPhrase[]>([]);
  const [rules, setRules] = useState<TranslationRule[]>([]);
  const [unknownWords, setUnknownWords] = useState<UnknownWord[]>([]);

  const [editingWordId, setEditingWordId] = useState<number | null>(null);
  const [wordForm, setWordForm] = useState({
    englishWord: "",
    gujaratiWord: "",
    wordType: "",
  });

  const [editingPhraseId, setEditingPhraseId] = useState<number | null>(null);
  const [phraseForm, setPhraseForm] = useState({
    englishPhrase: "",
    gujaratiPhrase: "",
    context: "",
  });

  const [editingRuleId, setEditingRuleId] = useState<number | null>(null);
  const [ruleForm, setRuleForm] = useState<RuleForm>({
    name: "",
    sourceLang: "en",
    targetLang: "gu",
    pattern: "",
    replacement: "",
    priority: "100",
  });

  const [testInput, setTestInput] = useState({
    text: "",
    sourceLang: "en" as "en" | "gu",
    targetLang: "gu" as "en" | "gu",
  });
  const [testOutput, setTestOutput] = useState<{
    translatedText: string;
    fromCache: boolean;
  } | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async (silent = false) => {
    if (!silent) setLoading(true);
    if (silent) setRefreshing(true);

    try {
      const [wordsData, phrasesData, rulesData, unknownData] = await Promise.all([
        translationAPI.getWords({ limit: 500 }),
        translationAPI.getPhrases({ limit: 500 }),
        translationAPI.getRules({ limit: 500 }),
        translationAPI.getUnknownWords({ limit: 200 }),
      ]);
      setWords(wordsData);
      setPhrases(phrasesData);
      setRules(rulesData);
      setUnknownWords(unknownData);
    } catch (error: unknown) {
      toast.error(getApiErrorMessage(error, "Failed to load language manager data"));
    } finally {
      if (!silent) setLoading(false);
      if (silent) setRefreshing(false);
    }
  };

  const resetWordForm = () => {
    setEditingWordId(null);
    setWordForm({
      englishWord: "",
      gujaratiWord: "",
      wordType: "",
    });
  };

  const resetPhraseForm = () => {
    setEditingPhraseId(null);
    setPhraseForm({
      englishPhrase: "",
      gujaratiPhrase: "",
      context: "",
    });
  };

  const resetRuleForm = () => {
    setEditingRuleId(null);
    setRuleForm({
      name: "",
      sourceLang: "en",
      targetLang: "gu",
      pattern: "",
      replacement: "",
      priority: "100",
    });
  };

  const submitWord = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingWordId) {
        await translationAPI.updateWord(editingWordId, {
          englishWord: wordForm.englishWord,
          gujaratiWord: wordForm.gujaratiWord,
          wordType: wordForm.wordType || null,
        });
        toast.success("Dictionary word updated");
      } else {
        await translationAPI.createWord({
          englishWord: wordForm.englishWord,
          gujaratiWord: wordForm.gujaratiWord,
          wordType: wordForm.wordType || undefined,
        });
        toast.success("Dictionary word added");
      }
      resetWordForm();
      loadData(true);
    } catch (error: unknown) {
      toast.error(getApiErrorMessage(error, "Failed to save dictionary word"));
    }
  };

  const submitPhrase = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingPhraseId) {
        await translationAPI.updatePhrase(editingPhraseId, {
          englishPhrase: phraseForm.englishPhrase,
          gujaratiPhrase: phraseForm.gujaratiPhrase,
          context: phraseForm.context || null,
        });
        toast.success("Phrase updated");
      } else {
        await translationAPI.createPhrase({
          englishPhrase: phraseForm.englishPhrase,
          gujaratiPhrase: phraseForm.gujaratiPhrase,
          context: phraseForm.context || undefined,
        });
        toast.success("Phrase added");
      }
      resetPhraseForm();
      loadData(true);
    } catch (error: unknown) {
      toast.error(getApiErrorMessage(error, "Failed to save phrase"));
    }
  };

  const submitRule = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        name: ruleForm.name || undefined,
        sourceLang: ruleForm.sourceLang,
        targetLang: ruleForm.targetLang,
        pattern: ruleForm.pattern,
        replacement: ruleForm.replacement,
        priority: Number.parseInt(ruleForm.priority || "100", 10) || 100,
      };

      if (editingRuleId) {
        await translationAPI.updateRule(editingRuleId, payload);
        toast.success("Translation rule updated");
      } else {
        await translationAPI.createRule(payload);
        toast.success("Translation rule added");
      }
      resetRuleForm();
      loadData(true);
    } catch (error: unknown) {
      toast.error(getApiErrorMessage(error, "Failed to save translation rule"));
    }
  };

  const runTestTranslation = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const result = await translationAPI.test({
        text: testInput.text,
        sourceLang: testInput.sourceLang,
        targetLang: testInput.targetLang,
      });
      setTestOutput({
        translatedText: result.translatedText,
        fromCache: result.fromCache,
      });
      toast.success("Translation test completed");
    } catch (error: unknown) {
      toast.error(getApiErrorMessage(error, "Failed to test translation"));
    }
  };

  const deleteWord = async (id: number) => {
    try {
      await translationAPI.deleteWord(id);
      toast.success("Dictionary word deleted");
      loadData(true);
    } catch (error: unknown) {
      toast.error(getApiErrorMessage(error, "Failed to delete dictionary word"));
    }
  };

  const deletePhrase = async (id: number) => {
    try {
      await translationAPI.deletePhrase(id);
      toast.success("Phrase deleted");
      loadData(true);
    } catch (error: unknown) {
      toast.error(getApiErrorMessage(error, "Failed to delete phrase"));
    }
  };

  const deleteRule = async (id: number) => {
    try {
      await translationAPI.deleteRule(id);
      toast.success("Rule deleted");
      loadData(true);
    } catch (error: unknown) {
      toast.error(getApiErrorMessage(error, "Failed to delete rule"));
    }
  };

  const resolveUnknownWord = async (unknownWord: UnknownWord, resolvedTranslation: string) => {
    try {
      await translationAPI.updateUnknownWord(unknownWord.id, {
        status: "RESOLVED",
        resolvedTranslation,
      });
      toast.success("Unknown word resolved and learned");
      loadData(true);
    } catch (error: unknown) {
      toast.error(getApiErrorMessage(error, "Failed to resolve unknown word"));
    }
  };

  if (loading) {
    return (
      <AdminPage>
        <AdminLoadingState label="Loading language manager..." />
      </AdminPage>
    );
  }

  return (
    <AdminPage>
      <AdminPageHeader
        title="Language Manager"
        description="Manage dictionary words, phrases, grammar rules, and translation learning."
        actions={
          <Button variant="outline" onClick={() => loadData(true)} disabled={refreshing}>
            <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        }
      />

      <AdminPanel>
        <Tabs defaultValue="words" className="space-y-4">
          <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="words">Words</TabsTrigger>
          <TabsTrigger value="phrases">Phrases</TabsTrigger>
          <TabsTrigger value="rules">Rules</TabsTrigger>
          <TabsTrigger value="unknown">Unknown</TabsTrigger>
          <TabsTrigger value="test">Test</TabsTrigger>
          </TabsList>

        <TabsContent value="words">
          <Card>
            <CardHeader>
              <CardTitle>Dictionary Words</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <form onSubmit={submitWord} className="grid gap-3 md:grid-cols-4">
                <Input
                  placeholder="English word"
                  value={wordForm.englishWord}
                  onChange={(e) => setWordForm({ ...wordForm, englishWord: e.target.value })}
                  required
                />
                <Input
                  placeholder="Gujarati word"
                  value={wordForm.gujaratiWord}
                  onChange={(e) => setWordForm({ ...wordForm, gujaratiWord: e.target.value })}
                  required
                />
                <Input
                  placeholder="Type (optional)"
                  value={wordForm.wordType}
                  onChange={(e) => setWordForm({ ...wordForm, wordType: e.target.value })}
                />
                <div className="flex gap-2">
                  <Button type="submit" className="flex-1">
                    {editingWordId ? "Update" : "Add"}
                  </Button>
                  {editingWordId && (
                    <Button type="button" variant="outline" onClick={resetWordForm}>
                      Cancel
                    </Button>
                  )}
                </div>
              </form>

              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>English</TableHead>
                      <TableHead>Gujarati</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {words.map((word) => (
                      <TableRow key={word.id}>
                        <TableCell className="font-medium">{word.englishWord}</TableCell>
                        <TableCell>{word.gujaratiWord}</TableCell>
                        <TableCell>{word.wordType || "-"}</TableCell>
                        <TableCell className="text-right">
                          <div className="inline-flex items-center gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setEditingWordId(word.id);
                                setWordForm({
                                  englishWord: word.englishWord,
                                  gujaratiWord: word.gujaratiWord,
                                  wordType: word.wordType || "",
                                });
                              }}
                            >
                              Edit
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => deleteWord(word.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="phrases">
          <Card>
            <CardHeader>
              <CardTitle>Phrase Dictionary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <form onSubmit={submitPhrase} className="grid gap-3 md:grid-cols-4">
                <Input
                  placeholder="English phrase"
                  value={phraseForm.englishPhrase}
                  onChange={(e) =>
                    setPhraseForm({ ...phraseForm, englishPhrase: e.target.value })
                  }
                  required
                />
                <Input
                  placeholder="Gujarati phrase"
                  value={phraseForm.gujaratiPhrase}
                  onChange={(e) =>
                    setPhraseForm({ ...phraseForm, gujaratiPhrase: e.target.value })
                  }
                  required
                />
                <Input
                  placeholder="Context (optional)"
                  value={phraseForm.context}
                  onChange={(e) => setPhraseForm({ ...phraseForm, context: e.target.value })}
                />
                <div className="flex gap-2">
                  <Button type="submit" className="flex-1">
                    {editingPhraseId ? "Update" : "Add"}
                  </Button>
                  {editingPhraseId && (
                    <Button type="button" variant="outline" onClick={resetPhraseForm}>
                      Cancel
                    </Button>
                  )}
                </div>
              </form>

              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>English</TableHead>
                      <TableHead>Gujarati</TableHead>
                      <TableHead>Context</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {phrases.map((phrase) => (
                      <TableRow key={phrase.id}>
                        <TableCell className="font-medium">{phrase.englishPhrase}</TableCell>
                        <TableCell>{phrase.gujaratiPhrase}</TableCell>
                        <TableCell>{phrase.context || "-"}</TableCell>
                        <TableCell className="text-right">
                          <div className="inline-flex items-center gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setEditingPhraseId(phrase.id);
                                setPhraseForm({
                                  englishPhrase: phrase.englishPhrase,
                                  gujaratiPhrase: phrase.gujaratiPhrase,
                                  context: phrase.context || "",
                                });
                              }}
                            >
                              Edit
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => deletePhrase(phrase.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rules">
          <Card>
            <CardHeader>
              <CardTitle>Translation Rules</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <form onSubmit={submitRule} className="grid gap-3 md:grid-cols-6">
                <Input
                  placeholder="Rule name"
                  value={ruleForm.name}
                  onChange={(e) => setRuleForm({ ...ruleForm, name: e.target.value })}
                />
                <select
                  className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                  value={ruleForm.sourceLang}
                  onChange={(e) =>
                    setRuleForm({ ...ruleForm, sourceLang: e.target.value as "en" | "gu" })
                  }
                >
                  <option value="en">en</option>
                  <option value="gu">gu</option>
                </select>
                <select
                  className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                  value={ruleForm.targetLang}
                  onChange={(e) =>
                    setRuleForm({ ...ruleForm, targetLang: e.target.value as "en" | "gu" })
                  }
                >
                  <option value="gu">gu</option>
                  <option value="en">en</option>
                </select>
                <Input
                  placeholder="Regex pattern"
                  value={ruleForm.pattern}
                  onChange={(e) => setRuleForm({ ...ruleForm, pattern: e.target.value })}
                  required
                />
                <Input
                  placeholder="Replacement"
                  value={ruleForm.replacement}
                  onChange={(e) => setRuleForm({ ...ruleForm, replacement: e.target.value })}
                  required
                />
                <div className="flex gap-2">
                  <Input
                    placeholder="Priority"
                    value={ruleForm.priority}
                    onChange={(e) => setRuleForm({ ...ruleForm, priority: e.target.value })}
                  />
                  <Button type="submit">{editingRuleId ? "Update" : "Add"}</Button>
                  {editingRuleId && (
                    <Button type="button" variant="outline" onClick={resetRuleForm}>
                      Cancel
                    </Button>
                  )}
                </div>
              </form>

              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Direction</TableHead>
                      <TableHead>Pattern</TableHead>
                      <TableHead>Replacement</TableHead>
                      <TableHead>Priority</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rules.map((rule) => (
                      <TableRow key={rule.id}>
                        <TableCell>{rule.name || "-"}</TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {rule.sourceLang} to {rule.targetLang}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-mono text-xs">{rule.pattern}</TableCell>
                        <TableCell className="font-mono text-xs">{rule.replacement}</TableCell>
                        <TableCell>{rule.priority}</TableCell>
                        <TableCell className="text-right">
                          <div className="inline-flex items-center gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setEditingRuleId(rule.id);
                                setRuleForm({
                                  name: rule.name || "",
                                  sourceLang: rule.sourceLang,
                                  targetLang: rule.targetLang,
                                  pattern: rule.pattern,
                                  replacement: rule.replacement,
                                  priority: String(rule.priority),
                                });
                              }}
                            >
                              Edit
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => deleteRule(rule.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="unknown">
          <Card>
            <CardHeader>
              <CardTitle>Unknown Words</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Word</TableHead>
                      <TableHead>Language</TableHead>
                      <TableHead>Count</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Resolve Translation</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {unknownWords.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                          No unknown words right now.
                        </TableCell>
                      </TableRow>
                    ) : (
                      unknownWords.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell className="font-medium">{item.word}</TableCell>
                          <TableCell>{item.language}</TableCell>
                          <TableCell>{item.occurrences}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{item.status}</Badge>
                          </TableCell>
                          <TableCell>
                            <UnknownWordResolver
                              word={item}
                              onResolve={(resolvedTranslation) =>
                                resolveUnknownWord(item, resolvedTranslation)
                              }
                            />
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="test">
          <Card>
            <CardHeader>
              <CardTitle>Translation Test</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <form onSubmit={runTestTranslation} className="space-y-3">
                <Textarea
                  placeholder="Enter text to translate"
                  value={testInput.text}
                  onChange={(e) => setTestInput({ ...testInput, text: e.target.value })}
                  rows={4}
                  required
                />
                <div className="grid gap-3 md:grid-cols-3">
                  <select
                    className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                    value={testInput.sourceLang}
                    onChange={(e) =>
                      setTestInput({ ...testInput, sourceLang: e.target.value as "en" | "gu" })
                    }
                  >
                    <option value="en">Source: English</option>
                    <option value="gu">Source: Gujarati</option>
                  </select>
                  <select
                    className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                    value={testInput.targetLang}
                    onChange={(e) =>
                      setTestInput({ ...testInput, targetLang: e.target.value as "en" | "gu" })
                    }
                  >
                    <option value="gu">Target: Gujarati</option>
                    <option value="en">Target: English</option>
                  </select>
                  <Button type="submit">Run Test</Button>
                </div>
              </form>

              {testOutput && (
                <Card className="border-dashed">
                  <CardContent className="pt-6">
                    <p className="mb-2 text-sm font-medium">Translated Output</p>
                    <p className="rounded-md border bg-muted/30 p-3 text-sm">
                      {testOutput.translatedText}
                    </p>
                    <p className="mt-2 text-xs text-muted-foreground">
                      Source: {testOutput.fromCache ? "cache hit" : "fresh translation"}
                    </p>
                  </CardContent>
                </Card>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        </Tabs>
      </AdminPanel>
    </AdminPage>
  );
}

function UnknownWordResolver({
  word,
  onResolve,
}: {
  word: UnknownWord;
  onResolve: (value: string) => Promise<void>;
}) {
  const [value, setValue] = useState(word.resolvedTranslation || "");
  const [saving, setSaving] = useState(false);

  return (
    <div className="flex items-center gap-2">
      <Input
        placeholder={word.language === "en" ? "Gujarati translation" : "English translation"}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="max-w-[240px]"
      />
      <Button
        size="sm"
        disabled={!value.trim() || saving}
        onClick={async () => {
          setSaving(true);
          try {
            await onResolve(value.trim());
          } finally {
            setSaving(false);
          }
        }}
      >
        {saving ? "Saving..." : "Resolve"}
      </Button>
    </div>
  );
}
