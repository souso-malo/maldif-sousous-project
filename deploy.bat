@echo off
echo ========================================
echo   DEPLOIEMENT AUTOMATIQUE COFFRE-FORT
echo ========================================
echo.

echo Etape 1: Initialisation Git...
git init
if %errorlevel% neq 0 (
    echo ERREUR: Git n'est pas installe. Installez Git d'abord.
    pause
    exit /b 1
)

echo Etape 2: Ajout des fichiers...
git add .

echo Etape 3: Premier commit...
git commit -m "Application coffre-fort avec partage temps reel"

echo.
echo ========================================
echo   INSTRUCTIONS SUIVANTES
echo ========================================
echo.
echo 1. Allez sur https://github.com
echo 2. Cliquez sur "New repository"
echo 3. Nom: coffre-fort-partage
echo 4. Cochez "Public"
echo 5. Cliquez "Create repository"
echo.
echo 6. Copiez l'URL qui apparait (ex: https://github.com/VOTRE_NOM/coffre-fort-partage.git)
echo.

set /p repo_url="Collez l'URL de votre repository GitHub ici: "

echo.
echo Etape 4: Connexion a GitHub...
git remote add origin %repo_url%

echo Etape 5: Envoi vers GitHub...
git push -u origin main

if %errorlevel% eq 0 (
    echo.
    echo ========================================
    echo   SUCCES! GITHUB TERMINE
    echo ========================================
    echo.
    echo Maintenant pour Vercel:
    echo 1. Allez sur https://vercel.com
    echo 2. Cliquez "Sign up" puis "Continue with GitHub"
    echo 3. Cliquez "New Project"
    echo 4. Selectionnez "coffre-fort-partage"
    echo 5. Cliquez "Deploy"
    echo 6. Attendez 2-3 minutes
    echo 7. Notez l'URL finale!
    echo.
    echo Votre app sera accessible partout dans le monde!
) else (
    echo ERREUR lors de l'envoi vers GitHub
    echo Verifiez vos identifiants Git
)

echo.
pause