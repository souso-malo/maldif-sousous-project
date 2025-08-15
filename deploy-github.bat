@echo off
echo ========================================
echo   DEPLOIEMENT POUR SOUSO-MALO
echo ========================================
echo.

echo Etape 1: Initialisation Git...
git init

echo Etape 2: Configuration Git pour souso-malo...
git config user.name "souso-malo"
git config user.email "votre-email@example.com"

echo Etape 3: Ajout de tous les fichiers...
git add .

echo Etape 4: Premier commit...
git commit -m "Gestionnaire coffre-fort avec partage temps reel - souso-malo"

echo Etape 5: Ajout du repository GitHub...
git remote add origin https://github.com/souso-malo/maldif-sousous-project.git

echo Etape 6: Creation de la branche main...
git branch -M main

echo Etape 7: Envoi vers GitHub...
git push -u origin main

if %errorlevel% eq 0 (
    echo.
    echo ========================================
    echo   SUCCES! GITHUB TERMINE
    echo ========================================
    echo.
    echo Repository: https://github.com/souso-malo/maldif-sousous-project
    echo.
    echo PROCHAINES ETAPES POUR VERCEL:
    echo 1. Allez sur https://vercel.com
    echo 2. Connectez-vous avec GitHub
    echo 3. Cliquez "New Project"
    echo 4. Selectionnez "maldif-sousous-project"
    echo 5. Cliquez "Deploy"
    echo 6. Votre URL sera: https://maldif-sousous-project.vercel.app
    echo.
) else (
    echo.
    echo ========================================
    echo   INSTRUCTIONS MANUELLES
    echo ========================================
    echo.
    echo 1. Allez sur https://github.com/souso-malo
    echo 2. Cliquez "New repository"
    echo 3. Nom: maldif-sousous-project
    echo 4. Cochez "Public"
    echo 5. Cliquez "Create repository"
    echo.
    echo Puis executez ces commandes:
    echo git remote add origin https://github.com/souso-malo/maldif-sousous-project.git
    echo git push -u origin main
)

echo.
pause