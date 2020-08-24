[![GitHub Workflow Status](https://img.shields.io/github/workflow/status/lesloi/bomberman/Node.js%20CI)](https://github.com/lesloi/bomberman/actions)

# Bomberman


## Description du projet

Bomberman se joue de deux a quatre joueurs. Les joueurs démarrent aux coins opposés d’une une grille 11×11.

Les joueurs peuvent se déplacer librement dans la grille. Toutes les cases de coordonnées paires de la grille sont inaccessibles, formant ainsi des couloirs pour les joueurs.

Les joueurs disposent d’un nombre illimité de bombes à retardement, qu’ils peuvent placer dans une case libre. Les bombes explosent après un nombre prédéterminé de secondes. Aucun joueur ne peut déposer plus d’une bombe en même temps.

Lorsqu’une bombe explose, son explosion frappe dans quatres directions, jusqu’à une distance préderminée. Un joueur frappé par une explosion est éliminé du jeu.

## Installation

Il est nécessaire d'avoir installé Node.js, version ^4.2.4.

Pour installer les modules et leurs dépendences, taper dans un terminal :

    npm install

## Chargement de la base de données MySQL

Il est nécessaire d'avoir installé une base de données de type MySQL, version ^5.5.47.

A partir d'une interface graphique comme phpMyAdmin ou en ligne de commande créer la base de données **bomberman**.

Récupérer ensuite la structure de la base de données, en important le fichier **bomberman.sql**.

## Lancer l'application

Le serveur MySQL doit être lancé pour faire fonctionner l'application :

    sudo service mysql start

Taper ensuite dans un terminal :

    node app.js

### Let's play and enjoy !


_Sources des images du jeux_ : http://opengameart.org/content/bomb-party-the-complete-set
