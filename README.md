# Délégués Manquants — Générateur Excel

Application web Next.js qui lit des **photos de feuilles de matchs manuscrites** et génère automatiquement un fichier Excel avec les colonnes :

| Colonne G | Colonne H |
|---|---|
| `<N° club>----` | `MANQUE DELEGUE MATCH <N° match>` |

---

## Pré-requis

- **Node.js 18+**
- Un compte **OpenAI** avec une clé API GPT-4o

---

## Installation

```bash
npm install
```

---

## Configuration

Créez (ou modifiez) le fichier `.env.local` à la racine du projet :

```env
OPENAI_API_KEY=sk-votre-cle-ici
```

> La clé ne doit **jamais** être committée. Le fichier `.env.local` est déjà dans `.gitignore`.

---

## Démarrage

```bash
npm run dev
```

Ouvrez [http://localhost:3000](http://localhost:3000).

---

## Utilisation

1. Glissez-déposez une ou plusieurs photos des feuilles de matchs manuscrites.
2. Cliquez sur **"Analyser et prévisualiser"**.
3. Vérifiez les données extraites dans le tableau.
4. Cliquez sur **"Télécharger l'Excel"** pour obtenir le fichier `.xlsx`.

---

## Stack technique

| Rôle | Technologie |
|---|---|
| Framework full-stack | Next.js 14 (App Router) |
| OCR manuscrit | OpenAI GPT-4o Vision |
| Génération Excel | SheetJS (`xlsx`) |
| Upload fichiers | react-dropzone |
| Style | Tailwind CSS |
