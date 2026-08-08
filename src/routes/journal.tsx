import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useProgress } from "@/lib/hooks/use-progress";
import type { JournalCategory, JournalEntry } from "@/lib/types";
import {
  BookOpenText,
  Plus,
  Search,
  Star,
  Tag,
  Code2,
  AlertTriangle,
  Lightbulb,
  FileText,
  Copy,
  Trash2,
  Edit3,
  ExternalLink,
  Eye,
  Check,
  Sparkles,
  Filter,
  X,
} from "lucide-react";
import { useState, useMemo } from "react";
import Markdown from "react-markdown";
import { toast } from "sonner";

export const Route = createFileRoute("/journal")({
  head: () => ({
    meta: [
      { title: "Engineering Journal · Forge" },
      {
        name: "description",
        content:
          "Document code notes, bugs, mistakes, TIL discoveries, and architectural insights.",
      },
      { property: "og:title", content: "Engineering Journal · Forge" },
      {
        property: "og:description",
        content: "Log your developer notes, mistakes, and discoveries.",
      },
    ],
  }),
  component: EngineeringJournal,
});

const CATEGORIES: { id: "all" | JournalCategory; label: string; icon: typeof Code2 }[] = [
  { id: "all", label: "All Entries", icon: FileText },
  { id: "code_note", label: "Code Notes", icon: Code2 },
  { id: "mistake", label: "Mistakes & Bugs", icon: AlertTriangle },
  { id: "discovery", label: "Discoveries & TIL", icon: Lightbulb },
  { id: "general", label: "General", icon: BookOpenText },
];

const CODE_LANGUAGES = ["typescript", "tsx", "javascript", "css", "html", "json", "bash", "sql"];

function EngineeringJournal() {
  const {
    journalEntries = [],
    addJournalEntry,
    updateJournalEntry,
    deleteJournalEntry,
    toggleJournalFavorite,
  } = useProgress();

  // Filters state
  const [selectedCategory, setSelectedCategory] = useState<"all" | JournalCategory>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);

  // Dialog & Active Entry state
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<JournalEntry | null>(null);
  const [viewingEntry, setViewingEntry] = useState<JournalEntry | null>(null);

  // Form State
  const [formCategory, setFormCategory] = useState<JournalCategory>("code_note");
  const [formTitle, setFormTitle] = useState("");
  const [formContent, setFormContent] = useState("");
  const [formTags, setFormTags] = useState("");
  const [formIsFavorite, setFormIsFavorite] = useState(false);

  // Code Note specific form state
  const [codeLanguage, setCodeLanguage] = useState("tsx");
  const [codeContent, setCodeContent] = useState("");

  // Mistake specific form state
  const [mistakeSymptom, setMistakeSymptom] = useState("");
  const [mistakeRootCause, setMistakeRootCause] = useState("");
  const [mistakeFix, setMistakeFix] = useState("");

  // Discovery specific form state
  const [discoveryTakeaway, setDiscoveryTakeaway] = useState("");
  const [discoveryUrl, setDiscoveryUrl] = useState("");

  // Editor Preview mode toggle
  const [isPreviewMode, setIsPreviewMode] = useState(false);

  // Extract unique tags across all entries
  const allTags = useMemo(() => {
    const tagMap = new Map<string, number>();
    journalEntries.forEach((entry) => {
      (entry.tags || []).forEach((t) => {
        tagMap.set(t, (tagMap.get(t) || 0) + 1);
      });
    });
    return Array.from(tagMap.entries()).sort((a, b) => b[1] - a[1]);
  }, [journalEntries]);

  // Filtered entries calculation
  const filteredEntries = useMemo(() => {
    return journalEntries.filter((entry) => {
      const matchesCategory = selectedCategory === "all" || entry.category === selectedCategory;
      const matchesFavorites = !showFavoritesOnly || entry.isFavorite;
      const matchesTag = !selectedTag || (entry.tags && entry.tags.includes(selectedTag));

      const query = searchQuery.toLowerCase().trim();
      const matchesQuery =
        !query ||
        entry.title.toLowerCase().includes(query) ||
        entry.content.toLowerCase().includes(query) ||
        (entry.tags && entry.tags.some((t) => t.toLowerCase().includes(query))) ||
        (entry.codeSnippet && entry.codeSnippet.code.toLowerCase().includes(query)) ||
        (entry.mistakeDetail &&
          (entry.mistakeDetail.symptom.toLowerCase().includes(query) ||
            entry.mistakeDetail.rootCause.toLowerCase().includes(query) ||
            entry.mistakeDetail.fix.toLowerCase().includes(query))) ||
        (entry.discoveryDetail && entry.discoveryDetail.keyTakeaway.toLowerCase().includes(query));

      return matchesCategory && matchesFavorites && matchesTag && matchesQuery;
    });
  }, [journalEntries, selectedCategory, showFavoritesOnly, selectedTag, searchQuery]);

  // Open creation dialog with template setup
  const handleOpenCreateDialog = (category: JournalCategory = "code_note") => {
    setEditingEntry(null);
    setFormCategory(category);
    setFormTitle("");
    setFormContent("");
    setFormTags("");
    setFormIsFavorite(false);

    setCodeLanguage("tsx");
    setCodeContent("");

    setMistakeSymptom("");
    setMistakeRootCause("");
    setMistakeFix("");

    setDiscoveryTakeaway("");
    setDiscoveryUrl("");

    setIsPreviewMode(false);
    setIsDialogOpen(true);
  };

  // Open edit dialog
  const handleOpenEditDialog = (entry: JournalEntry) => {
    setEditingEntry(entry);
    setFormCategory(entry.category);
    setFormTitle(entry.title);
    setFormContent(entry.content);
    setFormTags(entry.tags ? entry.tags.join(", ") : "");
    setFormIsFavorite(entry.isFavorite);

    if (entry.codeSnippet) {
      setCodeLanguage(entry.codeSnippet.language || "tsx");
      setCodeContent(entry.codeSnippet.code || "");
    } else {
      setCodeLanguage("tsx");
      setCodeContent("");
    }

    if (entry.mistakeDetail) {
      setMistakeSymptom(entry.mistakeDetail.symptom || "");
      setMistakeRootCause(entry.mistakeDetail.rootCause || "");
      setMistakeFix(entry.mistakeDetail.fix || "");
    } else {
      setMistakeSymptom("");
      setMistakeRootCause("");
      setMistakeFix("");
    }

    if (entry.discoveryDetail) {
      setDiscoveryTakeaway(entry.discoveryDetail.keyTakeaway || "");
      setDiscoveryUrl(entry.discoveryDetail.resourceUrl || "");
    } else {
      setDiscoveryTakeaway("");
      setDiscoveryUrl("");
    }

    setIsPreviewMode(false);
    setIsDialogOpen(true);
  };

  // Save entry (Create or Update)
  const handleSaveEntry = () => {
    if (!formTitle.trim()) {
      toast.error("Please enter a title for your journal entry.");
      return;
    }

    const parsedTags = formTags
      .split(",")
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    const payload: Omit<JournalEntry, "id" | "createdAt" | "updatedAt"> = {
      title: formTitle.trim(),
      category: formCategory,
      content: formContent.trim(),
      tags: parsedTags,
      isFavorite: formIsFavorite,
    };

    if (formCategory === "code_note" && codeContent.trim()) {
      payload.codeSnippet = {
        language: codeLanguage,
        code: codeContent.trim(),
      };
    }

    if (formCategory === "mistake" && (mistakeSymptom || mistakeRootCause || mistakeFix)) {
      payload.mistakeDetail = {
        symptom: mistakeSymptom.trim(),
        rootCause: mistakeRootCause.trim(),
        fix: mistakeFix.trim(),
      };
    }

    if (formCategory === "discovery" && (discoveryTakeaway || discoveryUrl)) {
      payload.discoveryDetail = {
        keyTakeaway: discoveryTakeaway.trim(),
        resourceUrl: discoveryUrl.trim() || undefined,
      };
    }

    if (editingEntry) {
      updateJournalEntry(editingEntry.id, payload);
      toast.success("Journal entry updated successfully!");
    } else {
      addJournalEntry(payload);
      toast.success("New journal entry created!");
    }

    setIsDialogOpen(false);
  };

  const handleDelete = (id: string, title: string) => {
    deleteJournalEntry(id);
    toast.success(`Deleted "${title}"`);
    if (viewingEntry?.id === id) {
      setViewingEntry(null);
    }
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success("Code snippet copied to clipboard!");
  };

  const getCategoryBadge = (cat: JournalCategory) => {
    switch (cat) {
      case "code_note":
        return (
          <Badge className="bg-cyan-500/10 text-cyan-400 border-cyan-500/20 gap-1 text-[11px]">
            <Code2 className="h-3 w-3" /> Code Note
          </Badge>
        );
      case "mistake":
        return (
          <Badge className="bg-amber-500/10 text-amber-400 border-amber-500/20 gap-1 text-[11px]">
            <AlertTriangle className="h-3 w-3" /> Mistake & Fix
          </Badge>
        );
      case "discovery":
        return (
          <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 gap-1 text-[11px]">
            <Lightbulb className="h-3 w-3" /> Discovery
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="gap-1 text-[11px]">
            <FileText className="h-3 w-3" /> General Note
          </Badge>
        );
    }
  };

  // Quick stats
  const stats = useMemo(() => {
    const total = journalEntries.length;
    const codeNotes = journalEntries.filter((e) => e.category === "code_note").length;
    const mistakes = journalEntries.filter((e) => e.category === "mistake").length;
    const discoveries = journalEntries.filter((e) => e.category === "discovery").length;
    const favorites = journalEntries.filter((e) => e.isFavorite).length;
    return { total, codeNotes, mistakes, discoveries, favorites };
  }, [journalEntries]);

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Developer Growth"
        title="Engineering Journal"
        description="Document code notes, bugs & root causes, TIL discoveries, and architectural patterns for long-term retention."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button
              onClick={() => handleOpenCreateDialog("code_note")}
              size="sm"
              className="gap-1.5"
            >
              <Plus className="h-4 w-4" /> New Entry
            </Button>
          </div>
        }
      />

      {/* Stats Overview */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <Card className="border-border/60 bg-card/50">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] uppercase font-semibold text-muted-foreground">
                Total Notes
              </p>
              <h4 className="text-xl font-extrabold font-mono mt-0.5">{stats.total}</h4>
            </div>
            <div className="h-9 w-9 rounded-lg bg-primary/10 text-primary grid place-items-center">
              <BookOpenText className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60 bg-card/50">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] uppercase font-semibold text-muted-foreground">
                Code Notes
              </p>
              <h4 className="text-xl font-extrabold font-mono text-cyan-400 mt-0.5">
                {stats.codeNotes}
              </h4>
            </div>
            <div className="h-9 w-9 rounded-lg bg-cyan-500/10 text-cyan-400 grid place-items-center">
              <Code2 className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60 bg-card/50">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] uppercase font-semibold text-muted-foreground">
                Mistakes Logged
              </p>
              <h4 className="text-xl font-extrabold font-mono text-amber-400 mt-0.5">
                {stats.mistakes}
              </h4>
            </div>
            <div className="h-9 w-9 rounded-lg bg-amber-500/10 text-amber-400 grid place-items-center">
              <AlertTriangle className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60 bg-card/50">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] uppercase font-semibold text-muted-foreground">
                Discoveries
              </p>
              <h4 className="text-xl font-extrabold font-mono text-emerald-400 mt-0.5">
                {stats.discoveries}
              </h4>
            </div>
            <div className="h-9 w-9 rounded-lg bg-emerald-500/10 text-emerald-400 grid place-items-center">
              <Lightbulb className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60 bg-card/50">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] uppercase font-semibold text-muted-foreground">Favorites</p>
              <h4 className="text-xl font-extrabold font-mono text-amber-300 mt-0.5">
                {stats.favorites}
              </h4>
            </div>
            <div className="h-9 w-9 rounded-lg bg-amber-400/10 text-amber-400 grid place-items-center">
              <Star className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Control Bar: Search, Category Tabs, Favorites & Tags Filter */}
      <div className="space-y-4">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search Bar */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search title, markdown content, tags, code snippets..."
              className="pl-9 pr-8 text-xs"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Quick Filter Controls */}
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant={showFavoritesOnly ? "default" : "outline"}
              size="sm"
              onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
              className="gap-1.5 text-xs"
            >
              <Star className={`h-3.5 w-3.5 ${showFavoritesOnly ? "fill-current" : ""}`} />
              Favorites Only
            </Button>

            {selectedTag && (
              <Badge variant="secondary" className="gap-1 text-xs py-1 px-2.5">
                <Tag className="h-3 w-3" /> Tag: {selectedTag}
                <X
                  className="h-3 w-3 cursor-pointer hover:text-destructive ml-1"
                  onClick={() => setSelectedTag(null)}
                />
              </Badge>
            )}
          </div>
        </div>

        {/* Category Filter Pills */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/40 pb-3">
          <div className="flex flex-wrap gap-1">
            {CATEGORIES.map((cat) => {
              const Icon = cat.icon;
              const isActive = selectedCategory === cat.id;
              return (
                <Button
                  key={cat.id}
                  variant={isActive ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setSelectedCategory(cat.id)}
                  className="gap-1.5 text-xs h-8"
                >
                  <Icon className="h-3.5 w-3.5" />
                  {cat.label}
                </Button>
              );
            })}
          </div>
        </div>

        {/* Tags Cloud Selector */}
        {allTags.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap text-xs text-muted-foreground">
            <span className="font-semibold text-foreground flex items-center gap-1">
              <Tag className="h-3 w-3 text-primary" /> Filter Tags:
            </span>
            {allTags.map(([tag, count]) => (
              <Badge
                key={tag}
                variant={selectedTag === tag ? "default" : "outline"}
                className="cursor-pointer text-[11px] py-0.5 px-2 transition hover:border-primary"
                onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
              >
                #{tag} <span className="opacity-70 ml-1 font-mono">({count})</span>
              </Badge>
            ))}
          </div>
        )}
      </div>

      {/* Journal Cards List / Grid */}
      {filteredEntries.length === 0 ? (
        <Card className="border-border/60 py-12 text-center">
          <CardContent className="space-y-3">
            <BookOpenText className="h-10 w-10 text-muted-foreground mx-auto opacity-50" />
            <h3 className="text-base font-bold">No Engineering Journal Entries Found</h3>
            <p className="text-xs text-muted-foreground max-w-md mx-auto">
              {searchQuery || selectedTag || showFavoritesOnly
                ? "No notes matched your current search filters. Try clearing your query or selected tag."
                : "Your engineering journal is empty. Log your first code note, bug mistake, or key discovery!"}
            </p>
            <Button
              onClick={() => handleOpenCreateDialog("code_note")}
              size="sm"
              className="gap-1.5 mt-2"
            >
              <Plus className="h-4 w-4" /> Create First Note
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredEntries.map((entry) => (
            <Card
              key={entry.id}
              className={`border-border/60 transition-all hover:border-primary/50 flex flex-col justify-between group relative overflow-hidden ${
                entry.isFavorite ? "border-amber-500/30" : ""
              }`}
            >
              <CardHeader className="p-5 pb-3 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  {getCategoryBadge(entry.category)}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => toggleJournalFavorite(entry.id)}
                      className="text-muted-foreground hover:text-amber-400 transition p-1"
                      title={entry.isFavorite ? "Remove from favorites" : "Add to favorites"}
                    >
                      <Star
                        className={`h-4 w-4 ${
                          entry.isFavorite ? "fill-amber-400 text-amber-400" : ""
                        }`}
                      />
                    </button>
                    <button
                      onClick={() => handleOpenEditDialog(entry)}
                      className="text-muted-foreground hover:text-primary transition p-1"
                      title="Edit Entry"
                    >
                      <Edit3 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(entry.id, entry.title)}
                      className="text-muted-foreground hover:text-destructive transition p-1"
                      title="Delete Entry"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <CardTitle
                  onClick={() => setViewingEntry(entry)}
                  className="text-base font-bold group-hover:text-primary transition-colors cursor-pointer line-clamp-2"
                >
                  {entry.title}
                </CardTitle>

                <p suppressHydrationWarning className="text-[11px] text-muted-foreground font-mono">
                  {new Date(entry.createdAt).toLocaleDateString(undefined, {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </p>
              </CardHeader>

              <CardContent className="p-5 pt-0 space-y-3 flex-1">
                {/* Content snippet */}
                {entry.content && (
                  <div className="text-xs text-muted-foreground line-clamp-3 leading-relaxed">
                    <div className="markdown-body">
                      <Markdown>{entry.content}</Markdown>
                    </div>
                  </div>
                )}

                {/* Category specific preview cards */}
                {entry.category === "code_note" && entry.codeSnippet && (
                  <div className="rounded bg-slate-950 p-2.5 border border-slate-800 text-[11px] font-mono text-slate-300 relative group/code">
                    <div className="flex justify-between text-[10px] text-slate-400 mb-1 border-b border-slate-800 pb-1">
                      <span>{entry.codeSnippet.language}</span>
                      <button
                        onClick={() => copyCode(entry.codeSnippet!.code)}
                        className="hover:text-cyan-400 flex items-center gap-1"
                      >
                        <Copy className="h-3 w-3" /> Copy
                      </button>
                    </div>
                    <pre className="overflow-x-auto line-clamp-4">{entry.codeSnippet.code}</pre>
                  </div>
                )}

                {entry.category === "mistake" && entry.mistakeDetail && (
                  <div className="space-y-1.5 p-2.5 rounded bg-amber-500/5 border border-amber-500/20 text-xs">
                    {entry.mistakeDetail.symptom && (
                      <p className="text-amber-400/90 font-medium line-clamp-1">
                        <span className="font-semibold text-amber-300">Symptom:</span>{" "}
                        {entry.mistakeDetail.symptom}
                      </p>
                    )}
                    {entry.mistakeDetail.fix && (
                      <p className="text-emerald-400/90 font-medium line-clamp-1">
                        <span className="font-semibold text-emerald-300">Fix:</span>{" "}
                        {entry.mistakeDetail.fix}
                      </p>
                    )}
                  </div>
                )}

                {entry.category === "discovery" && entry.discoveryDetail && (
                  <div className="p-2.5 rounded bg-emerald-500/5 border border-emerald-500/20 text-xs space-y-1">
                    <p className="text-emerald-300 font-medium line-clamp-2">
                      💡 {entry.discoveryDetail.keyTakeaway}
                    </p>
                    {entry.discoveryDetail.resourceUrl && (
                      <a
                        href={entry.discoveryDetail.resourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[11px] text-cyan-400 hover:underline flex items-center gap-1"
                      >
                        <ExternalLink className="h-3 w-3" /> Reference Link
                      </a>
                    )}
                  </div>
                )}

                {/* Tags */}
                {entry.tags && entry.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 pt-2">
                    {entry.tags.map((tag) => (
                      <Badge
                        key={tag}
                        variant="secondary"
                        className="text-[10px] py-0 cursor-pointer hover:bg-muted"
                        onClick={() => setSelectedTag(tag)}
                      >
                        #{tag}
                      </Badge>
                    ))}
                  </div>
                )}
              </CardContent>

              <div className="bg-muted/20 border-t border-border/40 p-3 px-5 flex items-center justify-between text-xs text-muted-foreground">
                <button
                  onClick={() => setViewingEntry(entry)}
                  className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
                >
                  <Eye className="h-3.5 w-3.5" /> Read Full Note
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* --- MODAL 1: CREATE / EDIT JOURNAL ENTRY DIALOG --- */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BookOpenText className="h-5 w-5 text-primary" />
              {editingEntry ? "Edit Journal Entry" : "Create New Engineering Journal Note"}
            </DialogTitle>
            <DialogDescription className="text-xs">
              Log code snippets, bugs and root causes, or key learning takeaways with Markdown
              support.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Category selector & Favorite toggle */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2 space-y-1">
                <label className="text-xs font-semibold">Category</label>
                <Select
                  value={formCategory}
                  onValueChange={(val: JournalCategory) => setFormCategory(val)}
                >
                  <SelectTrigger className="text-xs">
                    <SelectValue placeholder="Select Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="code_note">Code Note (Snippets & APIs)</SelectItem>
                    <SelectItem value="mistake">Mistake & Bug Log (Root Cause & Fix)</SelectItem>
                    <SelectItem value="discovery">Discovery (TIL & Takeaways)</SelectItem>
                    <SelectItem value="general">General Architecture Note</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-end pb-1">
                <Button
                  type="button"
                  variant={formIsFavorite ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFormIsFavorite(!formIsFavorite)}
                  className="w-full text-xs gap-1.5"
                >
                  <Star className={`h-3.5 w-3.5 ${formIsFavorite ? "fill-current" : ""}`} />
                  {formIsFavorite ? "Favorite Note" : "Mark Favorite"}
                </Button>
              </div>
            </div>

            {/* Note Title */}
            <div className="space-y-1">
              <label className="text-xs font-semibold">Title</label>
              <Input
                placeholder="e.g., Stale Closures in useEffect Event Listeners"
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                className="text-xs font-medium"
              />
            </div>

            {/* CATEGORY SPECIFIC INPUT FIELDS */}

            {/* 1. CODE NOTE fields */}
            {formCategory === "code_note" && (
              <div className="space-y-3 p-3 bg-cyan-500/5 border border-cyan-500/20 rounded-lg">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-cyan-400 flex items-center gap-1.5">
                    <Code2 className="h-4 w-4" /> Code Snippet
                  </label>
                  <Select value={codeLanguage} onValueChange={setCodeLanguage}>
                    <SelectTrigger className="h-7 text-xs w-32">
                      <SelectValue placeholder="Language" />
                    </SelectTrigger>
                    <SelectContent>
                      {CODE_LANGUAGES.map((lang) => (
                        <SelectItem key={lang} value={lang}>
                          {lang}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Textarea
                  placeholder="// Paste or write code snippet here..."
                  value={codeContent}
                  onChange={(e) => setCodeContent(e.target.value)}
                  className="font-mono text-xs min-h-32 bg-slate-950 text-slate-200"
                />
              </div>
            )}

            {/* 2. MISTAKE fields */}
            {formCategory === "mistake" && (
              <div className="space-y-3 p-3 bg-amber-500/5 border border-amber-500/20 rounded-lg">
                <label className="text-xs font-semibold text-amber-400 flex items-center gap-1.5">
                  <AlertTriangle className="h-4 w-4" /> Bug & Root Cause Details
                </label>
                <div className="space-y-2">
                  <Input
                    placeholder="Symptom: What went wrong or threw an error?"
                    value={mistakeSymptom}
                    onChange={(e) => setMistakeSymptom(e.target.value)}
                    className="text-xs"
                  />
                  <Textarea
                    placeholder="Root Cause: Why did it happen?"
                    value={mistakeRootCause}
                    onChange={(e) => setMistakeRootCause(e.target.value)}
                    className="text-xs min-h-16"
                  />
                  <Textarea
                    placeholder="Fix & Prevention: How did you fix it?"
                    value={mistakeFix}
                    onChange={(e) => setMistakeFix(e.target.value)}
                    className="text-xs min-h-16"
                  />
                </div>
              </div>
            )}

            {/* 3. DISCOVERY fields */}
            {formCategory === "discovery" && (
              <div className="space-y-3 p-3 bg-emerald-500/5 border border-emerald-500/20 rounded-lg">
                <label className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5">
                  <Lightbulb className="h-4 w-4" /> Discovery / Today I Learned (TIL)
                </label>
                <Textarea
                  placeholder="Key Takeaway: What is the main discovery or core mental model?"
                  value={discoveryTakeaway}
                  onChange={(e) => setDiscoveryTakeaway(e.target.value)}
                  className="text-xs min-h-20"
                />
                <Input
                  placeholder="Optional Reference URL (e.g., https://react.dev/...)"
                  value={discoveryUrl}
                  onChange={(e) => setDiscoveryUrl(e.target.value)}
                  className="text-xs font-mono"
                />
              </div>
            )}

            {/* Markdown Content Field with Editor / Preview Toggle */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold">Markdown Description & Notes</label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsPreviewMode(!isPreviewMode)}
                  className="h-6 text-xs gap-1"
                >
                  <Eye className="h-3 w-3" />
                  {isPreviewMode ? "Edit Markdown" : "Preview Markdown"}
                </Button>
              </div>

              {isPreviewMode ? (
                <div className="p-4 rounded-md border border-border bg-muted/30 min-h-36 text-xs text-foreground">
                  {formContent.trim() ? (
                    <div className="markdown-body">
                      <Markdown>{formContent}</Markdown>
                    </div>
                  ) : (
                    <span className="text-muted-foreground italic">
                      No Markdown content entered yet.
                    </span>
                  )}
                </div>
              ) : (
                <Textarea
                  placeholder="Write Markdown notes here... (Supports headers #, lists -, bold **, code blocks ```)"
                  value={formContent}
                  onChange={(e) => setFormContent(e.target.value)}
                  className="text-xs min-h-36 font-mono"
                />
              )}
            </div>

            {/* Tags Input */}
            <div className="space-y-1">
              <label className="text-xs font-semibold">Tags (comma separated)</label>
              <Input
                placeholder="e.g. React, Hooks, Performance, CSS"
                value={formTags}
                onChange={(e) => setFormTags(e.target.value)}
                className="text-xs"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)} className="text-xs">
              Cancel
            </Button>
            <Button onClick={handleSaveEntry} className="text-xs gap-1">
              <Check className="h-3.5 w-3.5" />
              {editingEntry ? "Save Changes" : "Create Note"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* --- MODAL 2: FULL NOTE READING VIEW DIALOG --- */}
      {viewingEntry && (
        <Dialog open={!!viewingEntry} onOpenChange={(open) => !open && setViewingEntry(null)}>
          <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
            <DialogHeader className="space-y-2 border-b border-border/40 pb-4">
              <div className="flex items-center justify-between">
                {getCategoryBadge(viewingEntry.category)}
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      toggleJournalFavorite(viewingEntry.id);
                      setViewingEntry({ ...viewingEntry, isFavorite: !viewingEntry.isFavorite });
                    }}
                    className="h-8 text-xs gap-1"
                  >
                    <Star
                      className={`h-4 w-4 ${
                        viewingEntry.isFavorite ? "fill-amber-400 text-amber-400" : ""
                      }`}
                    />
                    {viewingEntry.isFavorite ? "Favorited" : "Favorite"}
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const target = viewingEntry;
                      setViewingEntry(null);
                      handleOpenEditDialog(target);
                    }}
                    className="h-8 text-xs gap-1"
                  >
                    <Edit3 className="h-3.5 w-3.5" /> Edit
                  </Button>
                </div>
              </div>

              <DialogTitle className="text-xl font-extrabold">{viewingEntry.title}</DialogTitle>

              <p className="text-xs text-muted-foreground font-mono">
                Created: {new Date(viewingEntry.createdAt).toLocaleString()}
              </p>
            </DialogHeader>

            <div className="space-y-6 py-4">
              {/* Category-specific rich sections */}
              {viewingEntry.category === "code_note" && viewingEntry.codeSnippet && (
                <div className="rounded-lg bg-slate-950 p-4 border border-slate-800 text-xs font-mono text-slate-200 space-y-2">
                  <div className="flex items-center justify-between text-slate-400 text-xs border-b border-slate-800 pb-2">
                    <span className="font-semibold uppercase">
                      {viewingEntry.codeSnippet.language}
                    </span>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => copyCode(viewingEntry.codeSnippet!.code)}
                      className="h-6 text-xs text-slate-300 hover:text-cyan-400 gap-1"
                    >
                      <Copy className="h-3.5 w-3.5" /> Copy Snippet
                    </Button>
                  </div>
                  <pre className="overflow-x-auto p-2 leading-relaxed">
                    {viewingEntry.codeSnippet.code}
                  </pre>
                </div>
              )}

              {viewingEntry.category === "mistake" && viewingEntry.mistakeDetail && (
                <div className="space-y-4 p-4 rounded-lg bg-amber-500/5 border border-amber-500/20">
                  {viewingEntry.mistakeDetail.symptom && (
                    <div className="space-y-1">
                      <h5 className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                        Symptom / Error
                      </h5>
                      <p className="text-xs text-foreground bg-card p-2.5 rounded border border-border">
                        {viewingEntry.mistakeDetail.symptom}
                      </p>
                    </div>
                  )}

                  {viewingEntry.mistakeDetail.rootCause && (
                    <div className="space-y-1">
                      <h5 className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                        Root Cause
                      </h5>
                      <p className="text-xs text-foreground bg-card p-2.5 rounded border border-border">
                        {viewingEntry.mistakeDetail.rootCause}
                      </p>
                    </div>
                  )}

                  {viewingEntry.mistakeDetail.fix && (
                    <div className="space-y-1">
                      <h5 className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                        Fix & Resolution
                      </h5>
                      <p className="text-xs text-foreground bg-card p-2.5 rounded border border-border">
                        {viewingEntry.mistakeDetail.fix}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {viewingEntry.category === "discovery" && viewingEntry.discoveryDetail && (
                <div className="p-4 rounded-lg bg-emerald-500/5 border border-emerald-500/20 space-y-3">
                  <h5 className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                    Key Discovery (TIL)
                  </h5>
                  <p className="text-sm font-medium text-emerald-200">
                    {viewingEntry.discoveryDetail.keyTakeaway}
                  </p>

                  {viewingEntry.discoveryDetail.resourceUrl && (
                    <div className="pt-2">
                      <Button size="sm" variant="outline" asChild className="text-xs gap-1.5">
                        <a
                          href={viewingEntry.discoveryDetail.resourceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          Visit Reference Link <ExternalLink className="h-3 w-3" />
                        </a>
                      </Button>
                    </div>
                  )}
                </div>
              )}

              {/* Render Markdown Content */}
              {viewingEntry.content && (
                <div className="space-y-2">
                  <h5 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Markdown Notes
                  </h5>
                  <div className="p-4 rounded-lg border border-border bg-card text-xs leading-relaxed text-foreground">
                    <div className="markdown-body">
                      <Markdown>{viewingEntry.content}</Markdown>
                    </div>
                  </div>
                </div>
              )}

              {/* Tags */}
              {viewingEntry.tags && viewingEntry.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-2">
                  {viewingEntry.tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="text-xs">
                      #{tag}
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setViewingEntry(null)} className="text-xs">
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
