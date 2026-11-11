# MyTicket Frontend (Next.js)

Interface web responsive de la plateforme de billetterie **MyTicket** (portails Public/Utilisateur, Organisateur avec Scanner QR, et Administrateur).

## Configuration

Copiez le fichier d'exemple d'environnement :

```bash
cp .env.example .env.local
```

Variables utilisées :
- `NEXT_PUBLIC_API_URL` : URL de l'API Backend Express (par défaut `http://localhost:3000/api`)

## Démarrage en développement

Le serveur de développement écoute sur le port **3333** (aligné avec la politique CORS par défaut du backend) :

```bash
npm install
npm run dev
```

Ouvrez [http://localhost:3333](http://localhost:3333) dans votre navigateur.

## Qualité et Build

```bash
npm run lint
npm run build
npm start
```
