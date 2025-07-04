//══════════════════════════════╗
// 🟢 JS PARTIE 1
//══════════════════════════════╝

        // Initialisation des variables globales
        let products = JSON.parse(localStorage.getItem('totalInventoryProducts')) || [];
        let alerts = JSON.parse(localStorage.getItem('totalInventoryAlerts')) || [];
        let currentProductId = null;
        let scannerInitialized = false;
        let qrScannerInterval = null;

        // Initialisation Bootstrap
        const tooltipTriggerList = document.querySelectorAll('[data-bs-toggle="tooltip"]');
        const tooltipList = [...tooltipTriggerList].map(tooltipTriggerEl => new bootstrap.Tooltip(tooltipTriggerEl));

        // Modals
        const productModal = new bootstrap.Modal(document.getElementById('productModal'));
        const sellModal = new bootstrap.Modal(document.getElementById('sellModal'));
        const deleteModal = new bootstrap.Modal(document.getElementById('deleteModal'));

        // Fonctions utilitaires
        function generateProductCode() {
            const timestamp = new Date().getTime().toString().slice(-8);
            const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
            return `P${timestamp}${random}`;
        }

        function formatCurrency(value, currency) {
    if (!currency) {
        // Si aucune devise n'est spécifiée, utiliser le format d'affichage préféré
        return formatPriceForDisplay(value, 'usd'); // Par défaut, on considère les valeurs en USD
    }
    return formatPrice(value, currency);
}


        function formatDate(date) {
            const d = new Date(date);
            return d.toLocaleDateString('fr-FR') + ' ' + d.toLocaleTimeString('fr-FR');
        }

        function getStockStatus(quantity, minStock) {
            if (quantity <= 0) return 'out-of-stock';
            if (quantity <= minStock) return 'low-stock';
            return 'in-stock';
        }

        function getStockBadge(quantity, minStock) {
            const status = getStockStatus(quantity, minStock);
            let badge = '';
            
            if (status === 'in-stock') {
                badge = '<span class="badge badge-stock badge-in-stock">En stock</span>';
            } else if (status === 'low-stock') {
                badge = '<span class="badge badge-stock badge-low-stock">Stock faible</span>';
            } else if (status === 'out-of-stock') {
                badge = '<span class="badge badge-stock badge-out-of-stock">Rupture</span>';
            }
            
            return badge;
        }

        function generateBarcode(code, selector) {
    if (!code) return;
    
    try {
        setTimeout(() => {
            // Déterminer la taille à utiliser en fonction de la classe sur #print-items
            const printContainer = document.getElementById('print-items');
            let size = 'md'; // Taille par défaut
            
            if (printContainer.classList.contains('code-size-xs')) {
                size = 'xs';
            } else if (printContainer.classList.contains('code-size-sm')) {
                size = 'sm';
            } else if (printContainer.classList.contains('code-size-md')) {
                size = 'md';
            } else if (printContainer.classList.contains('code-size-lg')) {
                size = 'lg';
            } else if (printContainer.classList.contains('code-size-xl')) {
                size = 'xl';
            }
            
            // Configurations adaptées à chaque taille
            const config = {
                xs: { width: 1, height: 20, fontSize: 8, margin: 2 },
                sm: { width: 1.5, height: 30, fontSize: 10, margin: 3 },
                md: { width: 2, height: 40, fontSize: 12, margin: 4 },
                lg: { width: 2.5, height: 50, fontSize: 14, margin: 5 },
                xl: { width: 3, height: 60, fontSize: 16, margin: 6 }
            };
            
            JsBarcode(selector, code, {
                format: "CODE128",
                lineColor: "#000",
                width: config[size].width,
                height: config[size].height,
                displayValue: true,
                fontSize: config[size].fontSize,
                margin: config[size].margin
            });
        }, 0);
    } catch (e) {
        console.error("Erreur lors de la génération du code-barres:", e);
    }
}


function generateQRCode(data, elementId) {
    if (!data) return;
    
    try {
        setTimeout(() => {
            // Déterminer la taille à utiliser en fonction de la classe sur #print-items
            const printContainer = document.getElementById('print-items');
            let size = 'md'; // Taille par défaut
            
            if (printContainer.classList.contains('code-size-xs')) {
                size = 'xs';
            } else if (printContainer.classList.contains('code-size-sm')) {
                size = 'sm';
            } else if (printContainer.classList.contains('code-size-md')) {
                size = 'md';
            } else if (printContainer.classList.contains('code-size-lg')) {
                size = 'lg';
            } else if (printContainer.classList.contains('code-size-xl')) {
                size = 'xl';
            }
            
            // Configurations adaptées à chaque taille
            const config = {
                xs: { scale: 3 },
                sm: { scale: 4 },
                md: { scale: 5 },
                lg: { scale: 6 },
                xl: { scale: 7 }
            };
            
            const qr = qrcode(0, 'L');
            qr.addData(data);
            qr.make();
            
            const element = document.getElementById(elementId);
            if (element) {
                element.innerHTML = qr.createImgTag(config[size].scale);
            }
        }, 0);
    } catch (e) {
        console.error("Erreur lors de la génération du QR code:", e);
    }
}





        function showNotification(title, message, type = 'info') {
            const notificationCenter = document.getElementById('notification-center');
            
            const notification = document.createElement('div');
            notification.className = `notification notification-${type}`;
            
            notification.innerHTML = `
                <div class="notification-header">
                    <span class="notification-title">${title}</span>
                    <span class="notification-close">&times;</span>
                </div>
                <div class="notification-message">${message}</div>
            `;
            
            notificationCenter.appendChild(notification);
            
            // Fermeture auto après 5 secondes
            setTimeout(() => {
                notification.style.opacity = '0';
                setTimeout(() => {
                    notification.remove();
                }, 300);
            }, 5000);
            
            // Fermeture manuelle
            notification.querySelector('.notification-close').addEventListener('click', () => {
                notification.style.opacity = '0';
                setTimeout(() => {
                    notification.remove();
                }, 300);
            });
        }

        function updateLocalStorage() {
            localStorage.setItem('totalInventoryProducts', JSON.stringify(products));
            localStorage.setItem('totalInventoryAlerts', JSON.stringify(alerts));
        }

        function checkStockAlerts() {
            products.forEach(product => {
                // Vérification si le produit est en stock faible
                if (product.quantity <= product.minStock && product.quantity > 0) {
                    // Vérifier si une alerte existe déjà
                    const existingAlert = alerts.find(a => a.productId === product.id && a.type === 'low-stock' && !a.read);
                    
                    if (!existingAlert) {
                        alerts.push({
                            id: generateProductCode(),
                            productId: product.id,
                            productName: product.name,
                            type: 'low-stock',
                            quantity: product.quantity,
                            date: new Date().toISOString(),
                            read: false
                        });
                        
                        showNotification('Stock faible', `Le produit "${product.name}" est en stock faible (${product.quantity} restants).`, 'warning');
                    }
                }
                
                // Vérification si le produit est en rupture de stock
                if (product.quantity <= 0) {
                    // Vérifier si une alerte existe déjà
                    const existingAlert = alerts.find(a => a.productId === product.id && a.type === 'out-of-stock' && !a.read);
                    
                    if (!existingAlert) {
                        alerts.push({
                            id: generateProductCode(),
                            productId: product.id,
                            productName: product.name,
                            type: 'out-of-stock',
                            quantity: 0,
                            date: new Date().toISOString(),
                            read: false
                        });
                        
                        showNotification('Rupture de stock', `Le produit "${product.name}" est en rupture de stock.`, 'danger');
                    }
                }
            });
            
            updateLocalStorage();
            updateAlertsBadge();
            updateDashboardStats();
        }

        function updateAlertsBadge() {
            const unreadAlerts = alerts.filter(alert => !alert.read).length;
            const alertMenuItem = document.querySelector('[data-section="alerts"] a');
            
            if (unreadAlerts > 0) {
                if (!alertMenuItem.querySelector('.badge')) {
                    const badge = document.createElement('span');
                    badge.className = 'badge rounded-pill bg-danger ms-auto';
                    badge.textContent = unreadAlerts;
                    alertMenuItem.appendChild(badge);
                } else {
                    alertMenuItem.querySelector('.badge').textContent = unreadAlerts;
                }
            } else {
                const badge = alertMenuItem.querySelector('.badge');
                if (badge) badge.remove();
            }
        }

        // Event Listeners
        document.addEventListener('DOMContentLoaded', function() {
            initApp();
                // Initialiser les tooltips
    var tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    tooltipTriggerList.forEach(function(tooltipTriggerEl) {
        new bootstrap.Tooltip(tooltipTriggerEl);
    });
            // Charger les paramètres de devise
loadCurrencySettings();
initCurrencyEvents();

// Essayer de récupérer le taux de change en ligne au démarrage
// uniquement si aucun taux personnalisé n'est défini
if (!currencySettings.customRate) {
    fetchExchangeRate();
}

            updateDashboardStats();
            loadRecentProducts();
            loadInventoryTable();
            updateAlertsBadge();
            checkStockAlerts();
            
            // Navigation
            document.querySelectorAll('#sidebar .nav-item').forEach(item => {
                item.addEventListener('click', function() {
                    const section = this.getAttribute('data-section');
                    showSection(section);
                    
                    // Si on est sur un écran mobile, fermer le menu
                    if (window.innerWidth < 992) {
                        document.getElementById('sidebar').classList.remove('active');
                    }
                });
            });
            
            // Bouton de toggle mobile
            document.getElementById('mobile-toggle-btn').addEventListener('click', function() {
                document.getElementById('sidebar').classList.toggle('active');
            });
            
            // Voir tous les produits
            document.getElementById('view-all-products').addEventListener('click', function() {
                showSection('inventory');
            });
            
            // Bouton Ajouter dans l'inventaire
            document.getElementById('add-product-btn').addEventListener('click', function() {
                showSection('add-product');
            });
            
            // Formulaire d'ajout de produit
            document.getElementById('product-code-type').addEventListener('change', function() {
                const value = this.value;
                
                document.getElementById('code-scan-container').style.display = value === 'scan' ? 'block' : 'none';
                document.getElementById('code-manual-container').style.display = value === 'manual' ? 'block' : 'none';
            });
            
            // Prévisualisation des codes
            document.getElementById('product-name').addEventListener('input', updateCodePreview);
            document.getElementById('product-price').addEventListener('input', updateCodePreview);
            document.getElementById('product-code-manual').addEventListener('input', updateCodePreview);
            
            // Activation de la caméra pour le scan
            document.getElementById('start-scan').addEventListener('click', function() {
                const scannerContainer = document.getElementById('scanner-container');
                scannerContainer.classList.remove('d-none');
                initBarcodeScanner('scanner-video');
            });
            
            // Activation scanner dans la section scan
            document.getElementById('activate-scanner').addEventListener('click', function() {
                document.getElementById('scanner-area').style.display = 'block';
                document.getElementById('scan-result').style.display = 'none';
                initBarcodeScanner('scanner');
            });
            
            // Scanner un autre code
            document.getElementById('scan-another').addEventListener('click', function() {
                document.getElementById('scanner-area').style.display = 'block';
                document.getElementById('scan-result').style.display = 'none';
                initBarcodeScanner('scanner');
            });
            
            // Soumission du formulaire d'ajout
            document.getElementById('add-product-form').addEventListener('submit', function(e) {
                e.preventDefault();
                addNewProduct();
            });
            
            // Réinitialisation du formulaire
            document.getElementById('reset-form').addEventListener('click', function() {
                document.getElementById('add-product-form').reset();
                document.getElementById('code-preview-container').style.display = 'none';
            });
            
            // Recherche dans l'inventaire
            document.getElementById('search-inventory').addEventListener('input', function() {
                const searchTerm = this.value.toLowerCase();
                filterInventoryTable(searchTerm);
            });
            
            // Recherche pour impression
            document.getElementById('search-print').addEventListener('input', function() {
                const searchTerm = this.value.toLowerCase();
                filterPrintTable(searchTerm);
            });
            
            // Sélectionner tous pour impression
            document.getElementById('select-all-print').addEventListener('change', function() {
                const isChecked = this.checked;
                document.querySelectorAll('#print-products-table tbody input[type="checkbox"]').forEach(checkbox => {
                    checkbox.checked = isChecked;
                });
            });
            
            // Générer aperçu impression
            document.getElementById('generate-print').addEventListener('click', generatePrintPreview);
            
// Imprimer
document.getElementById('print-generated').addEventListener('click', function() {
    // Créer un conteneur temporaire pour l'impression
    const tempContainer = document.createElement('div');
    tempContainer.id = 'temp-print-container';
    tempContainer.style.position = 'absolute';
    tempContainer.style.left = '-9999px';
    
    // Copier le contenu à imprimer
    const printContent = document.getElementById('print-items').cloneNode(true);
    tempContainer.appendChild(printContent);
    document.body.appendChild(tempContainer);
    
    // Sauvegarder les styles d'origine
    const originalBodyOverflow = document.body.style.overflow;
    
    // Préparer l'impression
    document.body.style.overflow = 'visible';
    
    // Déclencher l'impression
    window.print();
    
    // Restaurer les styles d'origine et nettoyer
    setTimeout(function() {
        document.body.style.overflow = originalBodyOverflow;
        document.body.removeChild(tempContainer);
    }, 1000);
});


            
            // Enregistrer modifications
            document.getElementById('save-edit-product').addEventListener('click', saveEditProduct);
            
            // Confirmer suppression
            document.getElementById('confirm-delete').addEventListener('click', deleteProduct);
            
            // Confirmer vente
            document.getElementById('confirm-sell').addEventListener('click', sellProduct);
            
            // Quantité à vendre
            document.getElementById('sell-quantity').addEventListener('input', updateSellTotal);
            
            // Marquer toutes les alertes comme lues
            document.getElementById('mark-all-read').addEventListener('click', markAllAlertsAsRead);
            
            // Configuration des alertes
            document.getElementById('alerts-config-form').addEventListener('submit', function(e) {
                e.preventDefault();
                const defaultMinStock = parseInt(document.getElementById('default-min-stock').value) || 5;
                localStorage.setItem('totalInventoryDefaultMinStock', defaultMinStock);
                
                const enableEmailAlerts = document.getElementById('enable-email-alerts').checked;
                localStorage.setItem('totalInventoryEnableEmailAlerts', enableEmailAlerts);
                
                const alertEmail = document.getElementById('alert-email').value;
                localStorage.setItem('totalInventoryAlertEmail', alertEmail);
                
                showNotification('Configuration', 'Les paramètres d\'alerte ont été enregistrés.', 'success');
            });
            
            // Toggle pour les alertes email
            document.getElementById('enable-email-alerts').addEventListener('change', function() {
                document.getElementById('email-alerts-config').style.display = this.checked ? 'block' : 'none';
            });
            
            // Export inventaire
            document.getElementById('export-inventory').addEventListener('click', exportInventory);
            
            // Supprimer produit (bouton modal)
            document.getElementById('delete-product-btn').addEventListener('click', function() {
                const productId = document.getElementById('edit-product-id').value;
                const product = products.find(p => p.id === productId);
                
                if (product) {
                    document.getElementById('delete-product-name').textContent = product.name;
                    productModal.hide();
                    deleteModal.show();
                }
            });
        });

        // Initialisation de l'application
        function initApp() {
    // Charger les paramètres
    const defaultMinStock = localStorage.getItem('totalInventoryDefaultMinStock') || 5;
    document.getElementById('default-min-stock').value = defaultMinStock;
    
    const enableEmailAlerts = localStorage.getItem('totalInventoryEnableEmailAlerts') === 'true';
    document.getElementById('enable-email-alerts').checked = enableEmailAlerts;
    
    const alertEmail = localStorage.getItem('totalInventoryAlertEmail') || '';
    document.getElementById('alert-email').value = alertEmail;
    
    document.getElementById('email-alerts-config').style.display = enableEmailAlerts ? 'block' : 'none';
    
    // Initialiser les dropdowns personnalisés
    initCustomDropdowns();
    initInfoUnitMesureTooltips();
    // Charger les unités personnalisées
    loadCustomUnits();
    
    // Si c'est la première exécution, ajouter des produits d'exemple
    if (products.length === 0) {
        addSampleProducts();
    }
    
    // Chargement de la table des produits pour impression
    loadPrintTable();
}

        function addSampleProducts() {
    const sampleProducts = [
        {
            id: generateProductCode(),
            name: "Antenne TV extérieure",
            code: "ANT-TV-001",
            category: "antennes",
            price: 49.99,
            quantity: 15,
            unit: "piece", // Ajout de l'unité de mesure
            location: "Rayon 1, Étagère A",
            description: "Antenne TV puissante pour réception TNT HD",
            minStock: 5,
            supplier: "AntennaPro",
            dateAdded: new Date().toISOString(),
            movements: [
                {
                    type: "add",
                    quantity: 15,
                    date: new Date().toISOString(),
                    description: "Stock initial"
                }
            ]
        },
        {
            id: generateProductCode(),
            name: "Panneau solaire 100W",
            code: "SOL-100W",
            category: "panneaux-solaires",
            price: 129.99,
            quantity: 8,
            unit: "piece", // Ajout de l'unité de mesure
            location: "Rayon 2, Étagère C",
            description: "Panneau solaire monocristallin 100W",
            minStock: 3,
            supplier: "SolarTech",
            dateAdded: new Date().toISOString(),
            movements: [
                {
                    type: "add",
                    quantity: 8,
                    date: new Date().toISOString(),
                    description: "Stock initial"
                }
            ]
        },
        {
            id: generateProductCode(),
            name: "Perceuse sans fil 18V",
            code: "OUT-PER-01",
            category: "outillage",
            price: 89.90,
            quantity: 12,
            unit: "kit", // Ajout de l'unité de mesure
            location: "Rayon 3, Étagère B",
            description: "Perceuse-visseuse sans fil avec 2 batteries",
            minStock: 4,
            supplier: "OutilPro",
            dateAdded: new Date().toISOString(),
            movements: [
                {
                    type: "add",
                    quantity: 12,
                    date: new Date().toISOString(),
                    description: "Stock initial"
                }
            ]
        },
        {
            id: generateProductCode(),
            name: "Filtre à huile moto",
            code: "MOTO-FH-01",
            category: "motos",
            price: 12.50,
            quantity: 25,
            unit: "piece", // Ajout de l'unité de mesure
            location: "Rayon 4, Étagère D",
            description: "Filtre à huile compatible plusieurs modèles",
            minStock: 10,
            supplier: "MotoTech",
            dateAdded: new Date().toISOString(),
            movements: [
                {
                    type: "add",
                    quantity: 25,
                    date: new Date().toISOString(),
                    description: "Stock initial"
                }
            ]
        },
        {
            id: generateProductCode(),
            name: "Multimètre digital",
            code: "ELEC-MM-01",
            category: "electronique",
            price: 34.99,
            quantity: 7,
            unit: "piece", // Ajout de l'unité de mesure
            location: "Rayon 5, Étagère A",
            description: "Multimètre numérique professionnel",
            minStock: 3,
            supplier: "ElectroPro",
            dateAdded: new Date().toISOString(),
            movements: [
                {
                    type: "add",
                    quantity: 7,
                    date: new Date().toISOString(),
                    description: "Stock initial"
                }
            ]
        }
    ];
    
    products = sampleProducts;
    updateLocalStorage();
}

        function showSection(sectionId) {
    // Cacher toutes les sections
    document.querySelectorAll('.content-section').forEach(section => {
        section.style.display = 'none';
    });
    
    // Afficher la section demandée
    document.getElementById(sectionId).style.display = 'block';
    
    // Mettre à jour la navigation
    document.querySelectorAll('#sidebar .nav-item').forEach(item => {
        item.classList.remove('active');
    });
    document.querySelector(`#sidebar [data-section="${sectionId}"]`).classList.add('active');
    
    // Actions spécifiques selon la section
    if (sectionId === 'inventory') {
        loadInventoryTable();
    } else if (sectionId === 'print-codes') {
        loadPrintTable();
    } else if (sectionId === 'alerts') {
        loadAlertsTable();
    } else if (sectionId === 'add-product') {
        // Réinitialiser le formulaire
        document.getElementById('add-product-form').reset();
        document.getElementById('code-preview-container').style.display = 'none';
        document.getElementById('code-scan-container').style.display = 'none';
        document.getElementById('code-manual-container').style.display = 'none';
    } else if (sectionId === 'ai-assistant') {
        // Initialiser l'assistant IA
        initAiAssistant();
    }
}

        function updateDashboardStats() {
    // Compter le total des produits
    const totalProducts = products.reduce((total, product) => total + product.quantity, 0);
    document.getElementById('total-products').textContent = totalProducts;
    
    // Compter les produits en stock faible
    const lowStock = products.filter(product => 
        product.quantity > 0 && product.quantity <= product.minStock
    ).length;
    document.getElementById('low-stock').textContent = lowStock;
    
    // Compter les produits en rupture
    const outOfStock = products.filter(product => product.quantity <= 0).length;
    document.getElementById('out-of-stock').textContent = outOfStock;
    
    // Calculer la valeur totale du stock
    let totalValueUsd = 0;
    
    products.forEach(product => {
        const quantity = product.quantity;
        if (quantity <= 0) return;
        
        // Convertir le prix en USD si nécessaire
        let priceUsd;
        if (product.priceCurrency === 'cdf') {
            priceUsd = convertCdfToUsd(product.price);
        } else {
            priceUsd = product.price;
        }
        
        totalValueUsd += priceUsd * quantity;
    });
    
    // Afficher selon le mode préféré
    document.getElementById('total-value').innerHTML = formatPriceForDisplay(totalValueUsd, 'usd');
    
    // Mettre à jour les alertes sur le dashboard
    updateDashboardAlerts();
}


        function updateDashboardAlerts() {
            const stockAlertsContainer = document.getElementById('stock-alerts');
            stockAlertsContainer.innerHTML = '';
            
            const unreadAlerts = alerts.filter(alert => !alert.read).slice(0, 5);
            
            if (unreadAlerts.length === 0) {
                stockAlertsContainer.innerHTML = '<p class="text-center text-muted">Aucune alerte</p>';
                return;
            }
            
            unreadAlerts.forEach(alert => {
                const alertElement = document.createElement('div');
                alertElement.className = 'alert ' + (alert.type === 'low-stock' ? 'alert-warning' : 'alert-danger');
                
                let message = '';
                if (alert.type === 'low-stock') {
                    message = `<i class="fas fa-exclamation-triangle me-2"></i><strong>${alert.productName}</strong> : Stock faible (${alert.quantity} restants)`;
                } else if (alert.type === 'out-of-stock') {
                    message = `<i class="fas fa-times-circle me-2"></i><strong>${alert.productName}</strong> : Rupture de stock`;
                }
                
                alertElement.innerHTML = message;
                stockAlertsContainer.appendChild(alertElement);
            });
        }

        function loadRecentProducts() {
    const recentProductsTable = document.getElementById('recent-products-table').querySelector('tbody');
    recentProductsTable.innerHTML = '';
    
    if (products.length === 0) {
        recentProductsTable.innerHTML = '<tr><td colspan="6" class="text-center">Aucun produit trouvé</td></tr>';
        return;
    }
    
    // Trier par date d'ajout (du plus récent au plus ancien)
    const sortedProducts = [...products].sort((a, b) => 
        new Date(b.dateAdded) - new Date(a.dateAdded)
    ).slice(0, 5);
    
    sortedProducts.forEach(product => {
        const row = document.createElement('tr');
        
        // Formater le prix selon les préférences d'affichage
        const formattedPrice = formatPriceForDisplay(product.price, product.priceCurrency || 'usd');
        
        // Obtenir les informations sur l'unité de mesure
        const unitInfo = getUnitInfo(product.unit || 'piece');
        const unitBadge = `<span class="unit-badge"><i class="${unitInfo.icon}"></i>${unitInfo.name}</span>`;
        
        row.innerHTML = `
            <td>${product.name}</td>
            <td>${formattedPrice}</td>
            <td>${product.quantity} ${unitBadge}</td>
            <td>${product.location}</td>
            <td>${getStockBadge(product.quantity, product.minStock)}</td>
        `;
        
        recentProductsTable.appendChild(row);
    });
}



function loadInventoryTable() {
    const inventoryTable = document.getElementById('inventory-table').querySelector('tbody');
    inventoryTable.innerHTML = '';
    
    if (products.length === 0) {
        inventoryTable.innerHTML = '<tr><td colspan="8" class="text-center">Aucun produit trouvé</td></tr>';
        return;
    }
    
    products.forEach(product => {
        const row = document.createElement('tr');
        
        // Formater le prix selon les préférences d'affichage
        const formattedPrice = formatPriceForDisplay(product.price, product.priceCurrency || 'usd');
        
        // Obtenir les informations sur l'unité de mesure
        const unitInfo = getUnitInfo(product.unit || 'piece');
        const unitBadge = `<span class="unit-badge"><i class="${unitInfo.icon}"></i>${unitInfo.name}</span>`;
        
        row.innerHTML = `
            <td>${product.code}</td>
            <td>${product.name}</td>
            <td>${formattedPrice}</td>
            <td>${product.quantity}</td>
            <td>${unitBadge}</td>
            <td>${product.location}</td>
            <td>${getStockBadge(product.quantity, product.minStock)}</td>
            <td>
                <i class="fas fa-edit product-action text-primary" data-action="edit" data-id="${product.id}" title="Modifier"></i>
                <i class="fas fa-shopping-cart product-action text-success" data-action="sell" data-id="${product.id}" title="Vendre"></i>
                <i class="fas fa-print product-action text-warning" data-action="print" data-id="${product.id}" title="Imprimer"></i>
                <i class="fas fa-trash product-action text-danger" data-action="delete" data-id="${product.id}" title="Supprimer"></i>
            </td>
        `;
        
        inventoryTable.appendChild(row);
    });
    
    // Ajouter les événements aux boutons d'action
    document.querySelectorAll('.product-action').forEach(button => {
        button.addEventListener('click', function() {
            const action = this.getAttribute('data-action');
            const productId = this.getAttribute('data-id');
            
            if (action === 'edit') {
                openProductModal(productId);
            } else if (action === 'sell') {
                openSellModal(productId);
            } else if (action === 'print') {
                printProductCodes(productId);
            } else if (action === 'delete') {
                openDeleteModal(productId);
            }
        });
    });
}


        function filterInventoryTable(searchTerm) {
            const rows = document.querySelectorAll('#inventory-table tbody tr');
            
            rows.forEach(row => {
                const textContent = row.textContent.toLowerCase();
                if (textContent.includes(searchTerm)) {
                    row.style.display = '';
                } else {
                    row.style.display = 'none';
                }
            });
        }

        function loadPrintTable() {
            const printTable = document.getElementById('print-products-table').querySelector('tbody');
            printTable.innerHTML = '';
            
            if (products.length === 0) {
                printTable.innerHTML = '<tr><td colspan="5" class="text-center">Aucun produit trouvé</td></tr>';
                return;
            }
            
            products.forEach(product => {
                const row = document.createElement('tr');
                
                row.innerHTML = `
                    <td><input type="checkbox" class="print-select" data-id="${product.id}"></td>
                    <td>${product.code}</td>
                    <td>${product.name}</td>
                    <td>${formatCurrency(product.price)}</td>
                    <td>${product.quantity}</td>
                `;
                
                printTable.appendChild(row);
            });
        }

        function filterPrintTable(searchTerm) {
            const rows = document.querySelectorAll('#print-products-table tbody tr');
            
            rows.forEach(row => {
                const textContent = row.textContent.toLowerCase();
                if (textContent.includes(searchTerm)) {
                    row.style.display = '';
                } else {
                    row.style.display = 'none';
                }
            });
        }

        function loadAlertsTable() {
            const alertsTable = document.getElementById('alerts-table').querySelector('tbody');
            alertsTable.innerHTML = '';
            
            if (alerts.length === 0) {
                alertsTable.innerHTML = '<tr><td colspan="5" class="text-center">Aucune alerte trouvée</td></tr>';
                return;
            }
            
            // Trier par date (plus récent en premier)
            const sortedAlerts = [...alerts].sort((a, b) => new Date(b.date) - new Date(a.date));
            
            sortedAlerts.forEach(alert => {
                const row = document.createElement('tr');
                row.className = alert.read ? '' : 'table-warning';
                
                let alertType = '';
                if (alert.type === 'low-stock') {
                    alertType = '<span class="badge badge-stock badge-low-stock">Stock faible</span>';
                } else if (alert.type === 'out-of-stock') {
                    alertType = '<span class="badge badge-stock badge-out-of-stock">Rupture de stock</span>';
                }
                
                row.innerHTML = `
                    <td>${alert.productName}</td>
                    <td>${alertType}</td>
                    <td>${alert.quantity}</td>
                    <td>${formatDate(alert.date)}</td>
                    <td>
                        <button class="btn btn-sm btn-outline-primary mark-read-btn" data-id="${alert.id}" ${alert.read ? 'disabled' : ''}>
                            ${alert.read ? 'Lu' : 'Marquer comme lu'}
                        </button>
                    </td>
                `;
                
                alertsTable.appendChild(row);
            });
            
            // Ajouter les événements aux boutons
            document.querySelectorAll('.mark-read-btn').forEach(button => {
                button.addEventListener('click', function() {
                    const alertId = this.getAttribute('data-id');
                    markAlertAsRead(alertId);
                });
            });
        }

        function updateCodePreview() {
            const codeType = document.getElementById('product-code-type').value;
            const name = document.getElementById('product-name').value;
            const price = document.getElementById('product-price').value;
            
            if (!name) return;
            
            let code = '';
            if (codeType === 'generate') {
                code = generateProductCode();
            } else if (codeType === 'manual') {
                code = document.getElementById('product-code-manual').value;
                if (!code) return;
            } else {
                return;
            }
            
            document.getElementById('code-preview-container').style.display = 'block';
            
            // Générer le code-barres
            generateBarcode(code, '#barcode-preview');
            
            // Générer le QR code avec des informations supplémentaires
            const qrData = {
                code: code,
                name: name,
                price: price ? parseFloat(price) : 0
            };
            
            generateQRCode(JSON.stringify(qrData), 'qrcode-preview');
        }
        
        // Service pour les effets sonores et vibrations du scanner moderne
const NouvScanModernFeedback = {
    // Contexte audio
    audioContext: null,
    
    // Initialiser le contexte audio
    initAudio: function() {
        if (!this.audioContext) {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            this.audioContext = new AudioContext();
        }
        
        // Démarrer le contexte audio s'il est suspendu
        if (this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }
    },
    
    // Jouer un son de scanner
    playSound: function() {
        this.initAudio();
        
        // Durée très courte pour un beep net
        const duration = 0.07;
        
        // Oscillateur principal pour le beep
        const oscillator = this.audioContext.createOscillator();
        
        // Gain pour contrôler le volume et l'enveloppe du son
        const gainNode = this.audioContext.createGain();
        
        // Filtre pour affiner le son
        const filter = this.audioContext.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.value = 2500;
        filter.Q.value = 10;
        
        // Configuration de l'oscillateur
        oscillator.type = 'square';
        oscillator.frequency.setValueAtTime(2500, this.audioContext.currentTime);
        
        // Enveloppe sonore pour un beep net et court
        gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.7, this.audioContext.currentTime + 0.01);
        gainNode.gain.setValueAtTime(0.7, this.audioContext.currentTime + duration - 0.01);
        gainNode.gain.linearRampToValueAtTime(0, this.audioContext.currentTime + duration);
        
        // Connexion des nœuds audio
        oscillator.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        // Démarrage et arrêt de l'oscillateur
        oscillator.start();
        oscillator.stop(this.audioContext.currentTime + duration + 0.01);
    },
    
    // Faire vibrer l'appareil
    vibrate: function() {
        if (navigator.vibrate) {
            // Le pattern [40, 30, 70] signifie:
            // - vibrer 40ms
            // - pause 30ms
            // - vibrer 70ms
            navigator.vibrate([40, 30, 70]);
            return true;
        }
        return false;
    },
    
    // Déclencher le son et la vibration
    feedback: function() {
        this.playSound();
        this.vibrate();
    }
};


function initBarcodeScanner(videoElementId) {
    const videoElement = document.getElementById(videoElementId);
    
    // Identifier quel scanner est en cours d'utilisation
    let scannerNumber = 0;
    if (videoElementId === 'scanner-video') {
        scannerNumber = 1;
    } else if (videoElementId === 'scanner') {
        scannerNumber = 2;
    }
    
    // Afficher un message dans l'interface moderne
    updateScannerMessage(scannerNumber, 'Initialisation...');
    
    if (scannerInitialized) {
        Quagga.stop();
        if (qrScannerInterval) {
            clearInterval(qrScannerInterval);
            qrScannerInterval = null;
        }
    }
    
    // Demander l'accès à la caméra
    navigator.mediaDevices.getUserMedia({ 
        video: { 
            facingMode: "environment",
            advanced: [{ torch: false }] // La lampe est éteinte par défaut
        } 
    })
    .then(function(stream) {
        videoElement.srcObject = stream;
        videoElement.play();
        
        // Mise à jour du message
        updateScannerMessage(scannerNumber, 'Caméra activée...');
        
        // Stocke le track vidéo pour le flash
        const videoTrack = stream.getVideoTracks()[0];
        
        // Configure le flash si disponible
        setupFlashButton(scannerNumber, videoTrack);
        
        // Initialiser Quagga pour la détection de code-barres
        Quagga.init({
            inputStream: {
                name: "Live",
                type: "LiveStream",
                target: videoElement
            },
            decoder: {
                readers: [
                    "code_128_reader",
                    "ean_reader",
                    "ean_8_reader",
                    "code_39_reader",
                    "code_39_vin_reader",
                    "codabar_reader",
                    "upc_reader",
                    "upc_e_reader",
                    "i2of5_reader"
                ]
            }
        }, function(err) {
            if (err) {
                console.error(err);
                updateScannerMessage(scannerNumber, 'Erreur d\'initialisation');
                return;
            }
            scannerInitialized = true;
            Quagga.start();
            updateScannerMessage(scannerNumber, 'Scanner prêt');
            
            // Après 1,5 seconde, changer le message à "Recherche de codes..."
            setTimeout(() => {
                updateScannerMessage(scannerNumber, 'Positionnez le code dans le cadre');
            }, 1500);
        });
        
        // Écouter les résultats de Quagga
        Quagga.onDetected(function(result) {
            const code = result.codeResult.code;
            console.log("Detected barcode:", code);
            
            // Indiquer visuellement qu'un code a été détecté
            indicateDetection(scannerNumber);
            
            // Retour haptique et sonore
            NouvScanModernFeedback.feedback();
            
            processScannedCode(code);
        });
        
        // Initialiser le scanner QR
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        
        qrScannerInterval = setInterval(() => {
            if (videoElement.readyState === videoElement.HAVE_ENOUGH_DATA) {
                canvas.height = videoElement.videoHeight;
                canvas.width = videoElement.videoWidth;
                context.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
                const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
                
                const code = jsQR(imageData.data, imageData.width, imageData.height, {
                    inversionAttempts: "dontInvert",
                });
                
                if (code) {
                    console.log("Detected QR code:", code.data);
                    
                    // Indiquer visuellement qu'un code a été détecté
                    indicateDetection(scannerNumber);
                    
                    // Retour haptique et sonore
                    NouvScanModernFeedback.feedback();
                    
                    processScannedCode(code.data);
                }
            }
        }, 500);
    })
    .catch(function(err) {
        console.error("Error accessing camera:", err);
        showNotification("Erreur", "Impossible d'accéder à la caméra.", "error");
        updateScannerMessage(scannerNumber, 'Erreur caméra');
    });
    
    // Configurer les boutons de mode
    setupModeButtons(scannerNumber);
}

// Fonction pour mettre à jour le message du scanner
function updateScannerMessage(scannerNumber, message) {
    if (scannerNumber === 1) {
        const messageElement = document.querySelector('.NouvScanModernMessage');
        if (messageElement) {
            messageElement.textContent = message;
        }
    } else if (scannerNumber === 2) {
        const messageElement = document.querySelector('.NouvScanModern2Message');
        if (messageElement) {
            messageElement.textContent = message;
        }
    }
}

// Fonction pour indiquer visuellement une détection de code
function indicateDetection(scannerNumber) {
    let frame, prefix;
    
    if (scannerNumber === 1) {
        frame = document.querySelector('.NouvScanModernFrame');
        prefix = 'NouvScanModern';
    } else if (scannerNumber === 2) {
        frame = document.querySelector('.NouvScanModern2Frame');
        prefix = 'NouvScanModern2';
    }
    
    if (frame) {
        // Animation de détection
        frame.style.borderColor = 'var(--primary)';
        frame.style.boxShadow = '0 0 20px var(--primary), 0 0 0 5000px rgba(0, 0, 0, 0.7)';
        
        // Message de détection
        updateScannerMessage(scannerNumber, 'Code détecté !');
        
        // Réinitialisation de l'interface après détection
        setTimeout(() => {
            if (frame) {
                frame.style.borderColor = '';
                frame.style.boxShadow = '';
            }
        }, 1000);
    }
}

// Fonction pour configurer les boutons de mode
function setupModeButtons(scannerNumber) {
    let toggleModeBtn, barcodeIcon, qrCodeIcon, currentModeText, prefix;
    
    if (scannerNumber === 1) {
        toggleModeBtn = document.getElementById('NouvScanModernToggleMode');
        barcodeIcon = document.getElementById('NouvScanModernBarcode');
        qrCodeIcon = document.getElementById('NouvScanModernQRCode');
        currentModeText = document.getElementById('NouvScanModernCurrentMode');
        prefix = 'NouvScanModern';
    } else if (scannerNumber === 2) {
        toggleModeBtn = document.getElementById('NouvScanModern2ToggleMode');
        barcodeIcon = document.getElementById('NouvScanModern2Barcode');
        qrCodeIcon = document.getElementById('NouvScanModern2QRCode');
        currentModeText = document.getElementById('NouvScanModern2CurrentMode');
        prefix = 'NouvScanModern2';
    }
    
    if (toggleModeBtn && barcodeIcon && qrCodeIcon) {
        toggleModeBtn.addEventListener('click', function() {
            // Change le mode actif
            if (barcodeIcon.classList.contains('active')) {
                barcodeIcon.classList.remove('active');
                qrCodeIcon.classList.add('active');
                if (currentModeText) {
                    currentModeText.textContent = 'QR Code';
                }
                
                // Afficher un message de changement
                updateScannerMessage(scannerNumber, 'Mode QR Code activé');
                
                setTimeout(() => {
                    updateScannerMessage(scannerNumber, 'Positionnez le QR code dans le cadre');
                }, 1500);
            } else {
                barcodeIcon.classList.add('active');
                qrCodeIcon.classList.remove('active');
                if (currentModeText) {
                    currentModeText.textContent = 'Code-barres';
                }
                
                // Afficher un message de changement
                updateScannerMessage(scannerNumber, 'Mode Code-barres activé');
                
                setTimeout(() => {
                    updateScannerMessage(scannerNumber, 'Positionnez le code-barres dans le cadre');
                }, 1500);
            }
        });
    }
    
    // Configurer bouton annuler
    let cancelBtn;
    if (scannerNumber === 1) {
        cancelBtn = document.getElementById('NouvScanModernCancelScan');
    } else if (scannerNumber === 2) {
        cancelBtn = document.getElementById('NouvScanModern2CancelScan');
    }
    
    if (cancelBtn) {
        cancelBtn.addEventListener('click', function() {
            if (scannerNumber === 1) {
                document.getElementById('scanner-container').classList.add('d-none');
            } else if (scannerNumber === 2) {
                document.getElementById('scanner-area').style.display = 'none';
            }
            
            // Arrêter le scanner
            Quagga.stop();
            if (qrScannerInterval) {
                clearInterval(qrScannerInterval);
                qrScannerInterval = null;
            }
            scannerInitialized = false;
            
            // Fermer les flux vidéo
            const videos = document.querySelectorAll('video');
            videos.forEach(video => {
                if (video.srcObject) {
                    const tracks = video.srcObject.getTracks();
                    tracks.forEach(track => track.stop());
                    video.srcObject = null;
                }
            });
        });
    }
}

// Fonction pour configurer le bouton de flash
function setupFlashButton(scannerNumber, videoTrack) {
    let flashBtn;
    if (scannerNumber === 1) {
        flashBtn = document.getElementById('NouvScanModernToggleLight');
    } else if (scannerNumber === 2) {
        flashBtn = document.getElementById('NouvScanModern2ToggleLight');
    }
    
    if (flashBtn && videoTrack) {
        // Vérifier si la fonction torch est disponible
        const capabilities = videoTrack.getCapabilities();
        const hasTorch = 'torch' in capabilities;
        
        flashBtn.addEventListener('click', async function() {
            flashBtn.classList.toggle('active');
            const torchState = flashBtn.classList.contains('active');
            
            try {
                if (hasTorch) {
                    // Appliquer le changement de lampe torche
                    await videoTrack.applyConstraints({
                        advanced: [{ torch: torchState }]
                    });
                    
                    // Message flash activé/désactivé
                    updateScannerMessage(scannerNumber, torchState ? 'Flash activé' : 'Flash désactivé');
                    
                    setTimeout(() => {
                        updateScannerMessage(scannerNumber, 'Positionnez le code dans le cadre');
                    }, 1000);
                } else {
                    console.warn("La lampe torche n'est pas prise en charge sur cet appareil");
                    updateScannerMessage(scannerNumber, "Flash non disponible sur cet appareil");
                    
                    setTimeout(() => {
                        updateScannerMessage(scannerNumber, 'Positionnez le code dans le cadre');
                    }, 1500);
                }
            } catch (error) {
                console.error("Erreur lors de l'activation de la lampe torche:", error);
                updateScannerMessage(scannerNumber, "Erreur d'activation du flash");
                
                setTimeout(() => {
                    updateScannerMessage(scannerNumber, 'Positionnez le code dans le cadre');
                }, 1500);
            }
        });
    }
}


function processScannedCode(codeData) {
    // Arrêter le scanner
    Quagga.stop();
    if (qrScannerInterval) {
        clearInterval(qrScannerInterval);
        qrScannerInterval = null;
    }
    scannerInitialized = false;
    
    // Fermer les flux vidéo
    const videos = document.querySelectorAll('video');
    videos.forEach(video => {
        if (video.srcObject) {
            const tracks = video.srcObject.getTracks();
            tracks.forEach(track => track.stop());
            video.srcObject = null;
        }
    });
    
    // Traiter le code en fonction du contexte
    if (document.getElementById('add-product').style.display !== 'none') {
        // Si on est dans la section d'ajout de produit
        document.getElementById('scanner-container').classList.add('d-none');
        document.getElementById('product-code-manual').value = codeData;
        updateCodePreview();
    } else if (document.getElementById('scan').style.display !== 'none') {
        // Si on est dans la section de scan
        document.getElementById('scanner-area').style.display = 'none';
        document.getElementById('scan-result').style.display = 'block';
        
        // Essayer de parser le code comme JSON (QR code)
        try {
            const jsonData = JSON.parse(codeData);
            const product = products.find(p => p.code === jsonData.code);
            
            if (product) {
                displayScannedProduct(product);
            } else {
                showNotification("Erreur", "Produit non trouvé dans l'inventaire.", "error");
                document.getElementById('scan-another').click();
            }
        } catch (e) {
            // Si ce n'est pas du JSON, c'est probablement un code-barres
            const product = products.find(p => p.code === codeData);
            
            if (product) {
                displayScannedProduct(product);
            } else {
                showNotification("Erreur", "Produit non trouvé dans l'inventaire.", "error");
                document.getElementById('scan-another').click();
            }
        }
    }
}


        function displayScannedProduct(product) {
            document.getElementById('scanned-code').textContent = product.code;
            document.getElementById('scanned-name').textContent = product.name;
            document.getElementById('scanned-price').textContent = formatCurrency(product.price);
            document.getElementById('scanned-quantity').textContent = product.quantity;
            document.getElementById('scanned-location').textContent = product.location;
            
            // Configurer les boutons d'action
            document.getElementById('update-scanned').setAttribute('data-id', product.id);
            document.getElementById('sell-scanned').setAttribute('data-id', product.id);
            document.getElementById('print-scanned-codes').setAttribute('data-id', product.id);
            document.getElementById('delete-scanned').setAttribute('data-id', product.id);
            
            // Ajouter les événements
            document.getElementById('update-scanned').addEventListener('click', function() {
                const productId = this.getAttribute('data-id');
                openProductModal(productId);
            });
            
            document.getElementById('sell-scanned').addEventListener('click', function() {
                const productId = this.getAttribute('data-id');
                openSellModal(productId);
            });
            
            document.getElementById('print-scanned-codes').addEventListener('click', function() {
                const productId = this.getAttribute('data-id');
                printProductCodes(productId);
            });
            
            document.getElementById('delete-scanned').addEventListener('click', function() {
                const productId = this.getAttribute('data-id');
                openDeleteModal(productId);
            });
        }

        function addNewProduct() {
    const name = document.getElementById('product-name').value;
    const codeType = document.getElementById('product-code-type').value;
    let code = '';
    
    if (codeType === 'generate') {
        code = generateProductCode();
    } else if (codeType === 'manual') {
        code = document.getElementById('product-code-manual').value;
    } else {
        // Pour le moment, on génère un code car le scan n'est pas implémenté
        code = generateProductCode();
    }
    
    const category = document.getElementById('product-category').value;
    const price = parseFloat(document.getElementById('product-price').value);
    const priceCurrency = document.getElementById('product-price-currency').value;
    const quantity = parseInt(document.getElementById('product-quantity').value);
    const unit = document.getElementById('product-unit').value;
    const location = document.getElementById('product-location').value;
    const description = document.getElementById('product-description').value;
    const minStock = parseInt(document.getElementById('min-stock').value) || 5;
    const supplier = document.getElementById('supplier').value;
    
    const product = {
        id: generateProductCode(), // ID unique pour le produit
        name: name,
        code: code,
        category: category,
        price: price,
        priceCurrency: priceCurrency, // Stocker la devise d'origine
        quantity: quantity,
        unit: unit, // Nouvelle propriété: unité de mesure
        location: location,
        description: description,
        minStock: minStock,
        supplier: supplier,
        dateAdded: new Date().toISOString(),
        movements: [
            {
                type: "add",
                quantity: quantity,
                date: new Date().toISOString(),
                description: "Stock initial"
            }
        ]
    };
    
    products.push(product);
    updateLocalStorage();
    
    showNotification("Succès", `Le produit "${name}" a été ajouté avec succès.`, "success");
    
    // Réinitialiser le formulaire
    document.getElementById('add-product-form').reset();
    document.getElementById('code-preview-container').style.display = 'none';
    document.getElementById('code-scan-container').style.display = 'none';
    document.getElementById('code-manual-container').style.display = 'none';
    
    // Réinitialiser l'unité de mesure
    const dropdown = document.querySelector('#add-product .custom-dropdown');
    if (dropdown) {
        const selected = dropdown.querySelector('.custom-dropdown-selected .selected-text');
        selected.innerHTML = '<i class="fas fa-tag me-2"></i>Pièce';
        document.getElementById('product-unit').value = 'piece';
    }
    
    // Mettre à jour les statistiques et tables
    updateDashboardStats();
    loadRecentProducts();
    checkStockAlerts();
}



        function openProductModal(productId) {
    const product = products.find(p => p.id === productId);
    
    if (!product) {
        showNotification("Erreur", "Produit non trouvé.", "error");
        return;
    }
    
    currentProductId = productId;
    
    // Remplir le formulaire
    document.getElementById('edit-product-id').value = product.id;
    document.getElementById('edit-product-name').value = product.name;
    document.getElementById('edit-product-category').value = product.category;
    document.getElementById('edit-product-price').value = product.price;
    
    // Définir la devise du prix
    if (product.priceCurrency) {
        document.getElementById('edit-product-price-currency').value = product.priceCurrency;
    } else {
        // Pour compatibilité avec les anciens produits
        document.getElementById('edit-product-price-currency').value = 'usd';
    }
    
    document.getElementById('edit-product-quantity').value = product.quantity;
    document.getElementById('edit-product-location').value = product.location;
    document.getElementById('edit-product-description').value = product.description;
    document.getElementById('edit-min-stock').value = product.minStock;
    
    // Définir l'unité de mesure
    const unitValue = product.unit || 'piece';
    document.getElementById('edit-product-unit').value = unitValue;
    
    // Mettre à jour l'affichage du dropdown
    const unitInfo = getUnitInfo(unitValue);
    const dropdown = document.querySelector('#productModal .custom-dropdown');
    if (dropdown) {
        const selected = dropdown.querySelector('.custom-dropdown-selected .selected-text');
        selected.innerHTML = `<i class="${unitInfo.icon} me-2"></i>${unitInfo.name}`;
    }
    
    // Générer les codes
    generateBarcode(product.code, '#edit-barcode-preview');
    
    const qrData = {
        code: product.code,
        name: product.name,
        price: product.price,
        currency: product.priceCurrency || 'usd',
        unit: product.unit || 'piece'
    };
    
    generateQRCode(JSON.stringify(qrData), 'edit-qrcode-preview');
    
    // Afficher l'historique des mouvements
    const historyContainer = document.getElementById('product-history');
    historyContainer.innerHTML = '';
    
    if (product.movements && product.movements.length > 0) {
        const historyList = document.createElement('ul');
        historyList.className = 'list-group';
        
        product.movements.forEach(movement => {
            const item = document.createElement('li');
            item.className = 'list-group-item';
            
            let badge = '';
            if (movement.type === 'add') {
                badge = '<span class="badge bg-success">+' + movement.quantity + '</span>';
            } else if (movement.type === 'remove') {
                badge = '<span class="badge bg-danger">-' + movement.quantity + '</span>';
            } else if (movement.type === 'sell') {
                badge = '<span class="badge bg-primary">-' + movement.quantity + '</span>';
            }
            
            item.innerHTML = `
                <div class="d-flex justify-content-between align-items-center">
                    <span>${formatDate(movement.date)}</span>
                    ${badge}
                </div>
                <small class="text-muted">${movement.description}</small>
            `;
            
            historyList.appendChild(item);
        });
        
        historyContainer.appendChild(historyList);
    } else {
        historyContainer.innerHTML = '<p class="text-center text-muted">Aucun mouvement enregistré</p>';
    }
    
    // Afficher la modal
    productModal.show();
}


function saveEditProduct() {
    const productId = document.getElementById('edit-product-id').value;
    const product = products.find(p => p.id === productId);
    
    if (!product) {
        showNotification("Erreur", "Produit non trouvé.", "error");
        return;
    }
    
    const oldQuantity = product.quantity;
    const newQuantity = parseInt(document.getElementById('edit-product-quantity').value);
    
    // Mettre à jour les informations
    product.name = document.getElementById('edit-product-name').value;
    product.category = document.getElementById('edit-product-category').value;
    product.price = parseFloat(document.getElementById('edit-product-price').value);
    product.priceCurrency = document.getElementById('edit-product-price-currency').value;
    product.quantity = newQuantity;
    product.unit = document.getElementById('edit-product-unit').value; // Mettre à jour l'unité de mesure
    product.location = document.getElementById('edit-product-location').value;
    product.description = document.getElementById('edit-product-description').value;
    product.minStock = parseInt(document.getElementById('edit-min-stock').value);
    
    // Ajouter un mouvement si la quantité a changé
    if (oldQuantity !== newQuantity) {
        const difference = newQuantity - oldQuantity;
        
        if (difference !== 0) {
            const movementType = difference > 0 ? 'add' : 'remove';
            
            product.movements.push({
                type: movementType,
                quantity: Math.abs(difference),
                date: new Date().toISOString(),
                description: "Modification manuelle du stock"
            });
        }
    }
    
    updateLocalStorage();
    
    showNotification("Succès", `Le produit "${product.name}" a été mis à jour avec succès.`, "success");
    
    // Fermer la modal
    productModal.hide();
    
    // Mettre à jour les statistiques et tables
    updateDashboardStats();
    loadRecentProducts();
    loadInventoryTable();
    checkStockAlerts();
}


        function openSellModal(productId) {
            const product = products.find(p => p.id === productId);
            
            if (!product) {
                showNotification("Erreur", "Produit non trouvé.", "error");
                return;
            }
            
            currentProductId = productId;
            
            // Remplir le formulaire
            document.getElementById('sell-product-id').value = product.id;
            document.getElementById('sell-product-name').value = product.name;
            document.getElementById('sell-product-price').value = formatCurrency(product.price);
            document.getElementById('sell-stock-available').value = product.quantity;
            document.getElementById('sell-quantity').value = 1;
            document.getElementById('sell-quantity').max = product.quantity;
            
            // Calculer le prix total
            updateSellTotal();
            
            // Afficher la modal
            sellModal.show();
        }

        function updateSellTotal() {
            const productId = document.getElementById('sell-product-id').value;
            const product = products.find(p => p.id === productId);
            
            if (!product) return;
            
            const quantity = parseInt(document.getElementById('sell-quantity').value) || 0;
            const totalPrice = product.price * quantity;
            
            document.getElementById('sell-total-price').value = formatCurrency(totalPrice);
        }

        function sellProduct() {
            const productId = document.getElementById('sell-product-id').value;
            const product = products.find(p => p.id === productId);
            
            if (!product) {
                showNotification("Erreur", "Produit non trouvé.", "error");
                return;
            }
            
            const quantity = parseInt(document.getElementById('sell-quantity').value);
            
            if (quantity <= 0 || quantity > product.quantity) {
                showNotification("Erreur", "Quantité invalide.", "error");
                return;
            }
            
            // Mettre à jour la quantité
            product.quantity -= quantity;
            
            // Ajouter un mouvement
            product.movements.push({
                type: "sell",
                quantity: quantity,
                date: new Date().toISOString(),
                description: "Vente"
            });
            
            updateLocalStorage();
            
            showNotification("Succès", `${quantity} ${product.name} vendu(s) avec succès.`, "success");
            
            // Fermer la modal
            sellModal.hide();
            
            // Mettre à jour les statistiques et tables
            updateDashboardStats();
            loadRecentProducts();
            loadInventoryTable();
            checkStockAlerts();
        }

        function openDeleteModal(productId) {
            const product = products.find(p => p.id === productId);
            
            if (!product) {
                showNotification("Erreur", "Produit non trouvé.", "error");
                return;
            }
            
            currentProductId = productId;
            
            document.getElementById('delete-product-name').textContent = product.name;
            
            // Afficher la modal
            deleteModal.show();
        }

        function deleteProduct() {
            const productId = currentProductId;
            const productIndex = products.findIndex(p => p.id === productId);
            
            if (productIndex === -1) {
                showNotification("Erreur", "Produit non trouvé.", "error");
                return;
            }
            
            const productName = products[productIndex].name;
            
            // Supprimer le produit
            products.splice(productIndex, 1);
            
            // Supprimer les alertes associées
            alerts = alerts.filter(alert => alert.productId !== productId);
            
            updateLocalStorage();
            
            showNotification("Succès", `Le produit "${productName}" a été supprimé.`, "success");
            
            // Fermer la modal
            deleteModal.hide();
            
            // Mettre à jour les statistiques et tables
            updateDashboardStats();
            loadRecentProducts();
            loadInventoryTable();
            updateAlertsBadge();
        }

        function generatePrintPreview() {
    const selectedCheckboxes = document.querySelectorAll('#print-products-table tbody input[type="checkbox"]:checked');
    const printBarcode = document.getElementById('print-barcode').checked;
    const printQrcode = document.getElementById('print-qrcode').checked;
    const barcodeRepetitions = parseInt(document.getElementById('barcode-repetitions').value) || 1;
    const qrcodeRepetitions = parseInt(document.getElementById('qrcode-repetitions').value) || 1;
    const codeSize = document.getElementById('code-size').value;
    
    if (selectedCheckboxes.length === 0) {
        showNotification("Attention", "Veuillez sélectionner au moins un produit.", "warning");
        return;
    }
    
    if (!printBarcode && !printQrcode) {
        showNotification("Attention", "Veuillez sélectionner au moins un type de code à imprimer.", "warning");
        return;
    }
    
    const printItemsContainer = document.getElementById('print-items');
    printItemsContainer.innerHTML = '';
    printItemsContainer.className = `print-container code-size-${codeSize}`;
    
    // Créer un tableau de promesses pour la génération des codes
    const codeGenerationPromises = [];
    
    selectedCheckboxes.forEach(checkbox => {
        const productId = checkbox.getAttribute('data-id');
        const product = products.find(p => p.id === productId);
        
        if (product) {
            // Génération des codes-barres
            if (printBarcode) {
                for (let i = 0; i < barcodeRepetitions; i++) {
                    const barcodeItem = document.createElement('div');
                    barcodeItem.className = 'print-item barcode-item';
                    
                    barcodeItem.innerHTML = `
                        <h6 title="${product.name}">${product.name}</h6>
                        <div class="barcode-container">
                            <svg class="barcode-${product.id}-${i}"></svg>
                        </div>
                        <p>${formatCurrency(product.price)}</p>
                    `;
                    
                    printItemsContainer.appendChild(barcodeItem);
                    
                    // Ajouter la promesse de génération de code-barres
                    codeGenerationPromises.push(
                        new Promise(resolve => {
                            setTimeout(() => {
                                generateBarcode(product.code, `.barcode-${product.id}-${i}`);
                                resolve();
                            }, 0);
                        })
                    );
                }
            }
            
            // Génération des QR codes
            if (printQrcode) {
                for (let i = 0; i < qrcodeRepetitions; i++) {
                    const qrcodeItem = document.createElement('div');
                    qrcodeItem.className = 'print-item qrcode-item';
                    
                    qrcodeItem.innerHTML = `
                        <h6 title="${product.name}">${product.name}</h6>
                        <div id="qrcode-${product.id}-${i}" class="qrcode-container"></div>
                        <p>${formatCurrency(product.price)}</p>
                    `;
                    
                    printItemsContainer.appendChild(qrcodeItem);
                    
                    // Ajouter la promesse de génération de QR code
                    codeGenerationPromises.push(
                        new Promise(resolve => {
                            setTimeout(() => {
                                const qrData = {
                                    code: product.code,
                                    name: product.name,
                                    price: product.price
                                };
                                
                                generateQRCode(JSON.stringify(qrData), `qrcode-${product.id}-${i}`);
                                resolve();
                            }, 0);
                        })
                    );
                }
            }
        }
    });
    
    // Attendre que tous les codes soient générés
    Promise.all(codeGenerationPromises).then(() => {
        // Activer le bouton d'impression
        document.getElementById('print-generated').disabled = false;
        
        // Appliquer des ajustements finaux pour l'impression
        optimizeForPrinting();
        
        // Afficher une notification de succès
        showNotification("Succès", "Aperçu généré avec succès. Vous pouvez maintenant imprimer.", "success");
    });
}

function optimizeForPrinting() {
    // S'assurer que tous les éléments sont visibles et bien dimensionnés
    setTimeout(() => {
        const printItems = document.querySelectorAll('.print-item');
        
        printItems.forEach(item => {
            // Vérifier si les codes sont bien générés
            const barcode = item.querySelector('.barcode-container svg');
            const qrcode = item.querySelector('.qrcode-container img');
            
            if (barcode) {
                // S'assurer que le code-barre est visible
                barcode.style.display = 'block';
                barcode.style.margin = '0 auto';
            }
            
            if (qrcode) {
                // S'assurer que le QR code est visible
                qrcode.style.display = 'block';
                qrcode.style.margin = '0 auto';
            }
            
            // Vérifier le texte du nom du produit (tronqué si nécessaire)
            const nameTxt = item.querySelector('h6');
            if (nameTxt && nameTxt.scrollWidth > nameTxt.clientWidth) {
                nameTxt.style.overflow = 'hidden';
                nameTxt.style.textOverflow = 'ellipsis';
                nameTxt.style.whiteSpace = 'nowrap';
            }
        });
    }, 100);
}

// Fonction pour vérifier si une page est vide
function isPageEmpty(page) {
    return page.children.length === 0;
}

// Fonction pour s'assurer que chaque page a du contenu
function optimizePageBreaks() {
    const printItems = document.querySelectorAll('.print-item');
    const pageSize = {
        width: window.innerWidth,
        height: window.innerHeight
    };
    
    let currentPage = document.createElement('div');
    currentPage.className = 'print-page';
    document.getElementById('print-items').appendChild(currentPage);
    
    printItems.forEach((item) => {
        const itemHeight = item.offsetHeight;
        const itemWidth = item.offsetWidth;
        
        // Si l'item ne rentre pas dans la page courante, créer une nouvelle page
        if (currentPage.offsetHeight + itemHeight > pageSize.height) {
            currentPage = document.createElement('div');
            currentPage.className = 'print-page';
            document.getElementById('print-items').appendChild(currentPage);
        }
        
        currentPage.appendChild(item);
    });
    
    // Supprimer les pages vides
    document.querySelectorAll('.print-page').forEach((page) => {
        if (isPageEmpty(page)) {
            page.remove();
        }
    });
}



        function printProductCodes(productId) {
    const product = products.find(p => p.id === productId);
    
    if (!product) {
        showNotification("Erreur", "Produit non trouvé.", "error");
        return;
    }
    
    // Aller à la section impression
    showSection('print-codes');
    
    // Décocher toutes les cases
    document.querySelectorAll('#print-products-table tbody input[type="checkbox"]').forEach(checkbox => {
        checkbox.checked = false;
    });
    
    // Cocher seulement le produit sélectionné
    const checkbox = document.querySelector(`#print-products-table tbody input[data-id="${productId}"]`);
    if (checkbox) {
        checkbox.checked = true;
    }
    
    // Réinitialiser les options d'impression par défaut
    document.getElementById('print-barcode').checked = true;
    document.getElementById('print-qrcode').checked = true;
    document.getElementById('barcode-repetitions').value = 1;
    document.getElementById('qrcode-repetitions').value = 1;
    document.getElementById('code-size').value = 'md';
    
    // Générer l'aperçu
    generatePrintPreview();
}


        function markAlertAsRead(alertId) {
            const alert = alerts.find(a => a.id === alertId);
            
            if (!alert) {
                showNotification("Erreur", "Alerte non trouvée.", "error");
                return;
            }
            
            alert.read = true;
            updateLocalStorage();
            
            // Rafraîchir la table des alertes
            loadAlertsTable();
            updateAlertsBadge();
            updateDashboardAlerts();
        }

        function markAllAlertsAsRead() {
            alerts.forEach(alert => {
                alert.read = true;
            });
            
            updateLocalStorage();
            
            // Rafraîchir la table des alertes
            loadAlertsTable();
            updateAlertsBadge();
            updateDashboardAlerts();
            
            showNotification("Succès", "Toutes les alertes ont été marquées comme lues.", "success");
        }

        function exportInventory() {
            // Créer les données CSV
            let csvContent = "Code,Nom,Catégorie,Prix,Quantité,Emplacement,Description,Fournisseur\n";
            
            products.forEach(product => {
                const row = [
                    product.code,
                    product.name,
                    product.category,
                    product.price,
                    product.quantity,
                    product.location,
                    product.description,
                    product.supplier
                ].map(field => {
                    // Échapper les champs qui contiennent des virgules
                    if (String(field).includes(',')) {
                        return `"${String(field).replace(/"/g, '""')}"`;
                    }
                    return field;
                });
                
                csvContent += row.join(',') + "\n";
            });
            
            // Créer un lien de téléchargement
            const encodedUri = encodeURI("data:text/csv;charset=utf-8," + csvContent);
            const link = document.createElement("a");
            link.setAttribute("href", encodedUri);
            link.setAttribute("download", "inventaire_total_" + new Date().toISOString().slice(0, 10) + ".csv");
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            showNotification("Succès", "L'inventaire a été exporté avec succès.", "success");
        }
    
    
    // Variables pour l'historique
let History_Inventory_data = []; // Données d'historique
let History_Inventory_filteredData = []; // Données filtrées
let History_Inventory_currentPage = 1;
let History_Inventory_pageSize = 10;
let History_Inventory_totalPages = 1;
let History_Inventory_filters = {
    search: '',
    period: 'all',
    type: 'all',
    admin: 'all',
    day: 'all',
    startDate: null,
    endDate: null,
    month: null,
    year: 2025
};

// Initialisation des données d'historique avec des exemples
function History_Inventory_initData() {
    const productNames = [
        "Antenne TV extérieure", 
        "Panneau solaire 100W", 
        "Perceuse sans fil 18V", 
        "Filtre à huile moto", 
        "Multimètre digital"
    ];
    
    const productCodes = [
        "ANT-TV-001", 
        "SOL-100W", 
        "OUT-PER-01", 
        "MOTO-FH-01", 
        "ELEC-MM-01"
    ];
    
    const actions = [
        {type: "add", icon: "plus-circle", badgeClass: "actionAdd", label: "Ajout"},
        {type: "delete", icon: "trash", badgeClass: "actionDelete", label: "Suppression"},
        {type: "modify", icon: "edit", badgeClass: "actionModify", label: "Modification"},
        {type: "sale", icon: "shopping-cart", badgeClass: "actionSell", label: "Vente"},
        {type: "print", icon: "print", badgeClass: "actionPrint", label: "Impression"}
    ];
    
    const admins = [
        {name: "Admin Principal", initials: "AP", color: "#4A00E0", badge: "principal", badgeLabel: "Principal", icon: "crown"},
        {name: "Jean Dupont", initials: "JD", color: "#28a745", badge: "standard", badgeLabel: "Standard", icon: "user-shield"}
    ];
    
    const locations = ["Rayon 1, Étagère A", "Rayon 2, Étagère C", "Rayon 3, Étagère B", "Rayon 4, Étagère D", "Rayon 5, Étagère A"];
    
    // Génération d'entrées pour les 30 derniers jours
    const entries = [];
    
    for (let i = 0; i < 150; i++) {
        // Date aléatoire dans les 30 derniers jours
        const date = new Date();
        date.setDate(date.getDate() - Math.floor(Math.random() * 30));
        date.setHours(Math.floor(Math.random() * 24), Math.floor(Math.random() * 60), Math.floor(Math.random() * 60));
        
        const productIndex = Math.floor(Math.random() * productNames.length);
        const product = {
            name: productNames[productIndex],
            code: productCodes[productIndex]
        };
        
        const action = actions[Math.floor(Math.random() * actions.length)];
        const admin = admins[Math.floor(Math.random() * admins.length)];
        
        // Détails spécifiques selon le type d'action
        let details = {};
        
        switch(action.type) {
            case "add":
                details = {
                    quantity: Math.floor(Math.random() * 20) + 1,
                    price: (Math.random() * 100 + 10).toFixed(2),
                    location: locations[Math.floor(Math.random() * locations.length)]
                };
                break;
            case "delete":
                details = {
                    reason: ["Stock obsolète", "Produit défectueux", "Erreur d'inventaire"][Math.floor(Math.random() * 3)]
                };
                break;
            case "modify":
                const fields = ["Prix", "Quantité", "Emplacement", "Nom", "Catégorie"];
                const modifiedFields = [];
                const numFields = Math.floor(Math.random() * 3) + 1;
                
                for (let j = 0; j < numFields; j++) {
                    const field = fields[Math.floor(Math.random() * fields.length)];
                    if (!modifiedFields.includes(field)) {
                        modifiedFields.push(field);
                    }
                }
                
                details = {
                    modifications: modifiedFields.map(field => {
                        let oldValue, newValue;
                        switch(field) {
                            case "Prix":
                                oldValue = (Math.random() * 100 + 10).toFixed(2) + " €";
                                newValue = (Math.random() * 100 + 10).toFixed(2) + " €";
                                break;
                            case "Quantité":
                                oldValue = Math.floor(Math.random() * 20);
                                newValue = Math.floor(Math.random() * 20);
                                break;
                            case "Emplacement":
                                oldValue = locations[Math.floor(Math.random() * locations.length)];
                                newValue = locations[Math.floor(Math.random() * locations.length)];
                                break;
                            case "Nom":
                                oldValue = product.name;
                                newValue = product.name + " Pro";
                                break;
                            case "Catégorie":
                                oldValue = ["Électronique", "Outillage", "Panneaux solaires"][Math.floor(Math.random() * 3)];
                                newValue = ["Électronique", "Outillage", "Panneaux solaires"][Math.floor(Math.random() * 3)];
                                break;
                        }
                        return {field, oldValue, newValue};
                    })
                };
                break;
            case "sale":
                const quantity = Math.floor(Math.random() * 5) + 1;
                const unitPrice = (Math.random() * 100 + 10).toFixed(2);
                details = {
                    quantity: quantity,
                    unitPrice: unitPrice + " €",
                    totalPrice: (quantity * parseFloat(unitPrice)).toFixed(2) + " €"
                };
                break;
            case "print":
                details = {
                    codeType: Math.random() > 0.5 ? "Code-barres" : "QR Code",
                    quantity: Math.floor(Math.random() * 10) + 1
                };
                break;
        }
        
        entries.push({
            id: `ACT-${date.getFullYear()}${(date.getMonth()+1).toString().padStart(2, '0')}${date.getDate().toString().padStart(2, '0')}${date.getHours().toString().padStart(2, '0')}${date.getMinutes().toString().padStart(2, '0')}-${action.type.toUpperCase().substring(0, 3)}-${i.toString().padStart(3, '0')}`,
            date: date,
            action: action,
            product: product,
            details: details,
            admin: admin
        });
    }
    
    // Tri par date (plus récent en premier)
    entries.sort((a, b) => b.date - a.date);
    
    History_Inventory_data = entries;
    History_Inventory_filteredData = [...entries];
    History_Inventory_updateTotalPages();
}

// Chargement des données d'historique
function History_Inventory_loadData() {
    if (History_Inventory_data.length === 0) {
        History_Inventory_initData();
    }
    
    History_Inventory_updateTable();
    History_Inventory_updatePagination();
}

// Mise à jour de la table avec les données filtrées
function History_Inventory_updateTable() {
    const tbody = document.getElementById('History_Inventory_tableBody');
    tbody.innerHTML = '';
    
    const startIndex = (History_Inventory_currentPage - 1) * History_Inventory_pageSize;
    const endIndex = Math.min(startIndex + History_Inventory_pageSize, History_Inventory_filteredData.length);
    
    if (History_Inventory_filteredData.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" class="text-center py-4">
                    <i class="fas fa-info-circle me-2 text-secondary"></i>
                    Aucune entrée trouvée correspondant aux critères de filtrage.
                </td>
            </tr>
        `;
        return;
    }
    
    for (let i = startIndex; i < endIndex; i++) {
        const entry = History_Inventory_filteredData[i];
        const row = document.createElement('tr');
        
        // Formatage de la date
        const dateOptions = { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        };
        const formattedDate = entry.date.toLocaleDateString('fr-FR', dateOptions);
        
        // Détails formatés selon le type d'action
        let detailsHtml = '';
        
        switch(entry.action.type) {
            case "add":
                detailsHtml = `Quantité: <strong>${entry.details.quantity}</strong> | Prix: <strong>${entry.details.price} €</strong>`;
                break;
            case "delete":
                detailsHtml = `Raison: <strong>${entry.details.reason}</strong>`;
                break;
            case "modify":
                detailsHtml = `<strong>${entry.details.modifications.length}</strong> champ(s) modifié(s)`;
                break;
            case "sale":
                detailsHtml = `Quantité: <strong>${entry.details.quantity}</strong> | Total: <strong>${entry.details.totalPrice}</strong>`;
                break;
            case "print":
                detailsHtml = `Type: <strong>${entry.details.codeType}</strong> | Quantité: <strong>${entry.details.quantity}</strong>`;
                break;
        }
        
        row.innerHTML = `
            <td><input type="checkbox" class="History_Inventory_entryCheckbox" data-id="${entry.id}"></td>
            <td>
                <div style="white-space: nowrap;"><i class="fas fa-calendar-day me-1"></i> ${formattedDate.split(' à ')[0]}</div>
                <div style="white-space: nowrap; color: var(--gray);"><i class="fas fa-clock me-1"></i> ${formattedDate.split(' à ')[1]}</div>
            </td>
            <td>
                <span class="History_Inventory_actionBadge History_Inventory_${entry.action.badgeClass}">
                    <i class="fas fa-${entry.action.icon} me-1"></i> ${entry.action.label}
                </span>
            </td>
            <td>
                <div>${entry.product.name}</div>
                <div style="color: var(--gray); font-size: 0.85em;">${entry.product.code}</div>
            </td>
            <td>${detailsHtml}</td>
            <td>
                <div class="History_Inventory_adminInfo">
                    <div class="History_Inventory_adminAvatar" style="background-color: ${entry.admin.color}">
                        ${entry.admin.initials}
                    </div>
                    <div>
                        <div style="white-space: nowrap;">${entry.admin.name}</div>
                        <span class="admin-badge ${entry.admin.badge}">
                            <i class="fas fa-${entry.admin.icon} me-1"></i> ${entry.admin.badgeLabel}
                        </span>
                    </div>
                </div>
            </td>
        `;
        
        // Ajouter un événement de clic pour ouvrir le modal de détails
        row.addEventListener('click', function(e) {
            if (e.target.type !== 'checkbox') {
                History_Inventory_openDetailModal(entry);
            }
        });
        
        tbody.appendChild(row);
    }
    
    // Mise à jour des informations de pagination
    document.getElementById('History_Inventory_totalEntries').textContent = `${History_Inventory_filteredData.length} entrées`;
    document.getElementById('History_Inventory_totalEntriesFooter').textContent = History_Inventory_filteredData.length;
    document.getElementById('History_Inventory_startEntry').textContent = History_Inventory_filteredData.length > 0 ? startIndex + 1 : 0;
    document.getElementById('History_Inventory_endEntry').textContent = endIndex;
}

// Mise à jour de la pagination
function History_Inventory_updatePagination() {
    const pageNumbers = document.getElementById('History_Inventory_pageNumbers');
    pageNumbers.innerHTML = '';
    
    // Si peu de pages, on affiche toutes les pages
    if (History_Inventory_totalPages <= 5) {
        for (let i = 1; i <= History_Inventory_totalPages; i++) {
            if (i === History_Inventory_currentPage) {
                pageNumbers.innerHTML += `<span class="History_Inventory_currentPage">${i}</span>`;
            } else {
                const pageBtn = document.createElement('div');
                pageBtn.className = 'History_Inventory_pageNumber';
                pageBtn.textContent = i;
                pageBtn.addEventListener('click', () => {
                    History_Inventory_goToPage(i);
                });
                pageNumbers.appendChild(pageBtn);
            }
        }
    } else {
        // Sinon, on affiche un sous-ensemble avec ellipsis
        let pages = [];
        
        // Toujours afficher la première page
        pages.push(1);
        
        // Pages autour de la page actuelle
        for (let i = Math.max(2, History_Inventory_currentPage - 1); i <= Math.min(History_Inventory_totalPages - 1, History_Inventory_currentPage + 1); i++) {
            pages.push(i);
        }
        
        // Toujours afficher la dernière page
        pages.push(History_Inventory_totalPages);
        
        // Trier et dédupliquer
        pages = [...new Set(pages)].sort((a, b) => a - b);
        
        // Ajouter les ellipsis si nécessaire
        for (let i = 0; i < pages.length; i++) {
            // Ajouter ellipsis avant
            if (i > 0 && pages[i] > pages[i-1] + 1) {
                pageNumbers.innerHTML += `<span class="History_Inventory_pageEllipsis">...</span>`;
            }
            
            // Ajouter la page
            if (pages[i] === History_Inventory_currentPage) {
                pageNumbers.innerHTML += `<span class="History_Inventory_currentPage">${pages[i]}</span>`;
            } else {
                const pageBtn = document.createElement('div');
                pageBtn.className = 'History_Inventory_pageNumber';
                pageBtn.textContent = pages[i];
                pageBtn.addEventListener('click', () => {
                    History_Inventory_goToPage(pages[i]);
                });
                pageNumbers.appendChild(pageBtn);
            }
        }
    }
    
    // Mise à jour des états des boutons de pagination
    document.getElementById('History_Inventory_firstPage').disabled = History_Inventory_currentPage === 1;
    document.getElementById('History_Inventory_prevPage').disabled = History_Inventory_currentPage === 1;
    document.getElementById('History_Inventory_nextPage').disabled = History_Inventory_currentPage === History_Inventory_totalPages;
    document.getElementById('History_Inventory_lastPage').disabled = History_Inventory_currentPage === History_Inventory_totalPages;
}

// Ouvrir le modal de détails pour une entrée spécifique
function History_Inventory_openDetailModal(entry) {
    const modal = new bootstrap.Modal(document.getElementById('History_Inventory_detailModal'));
    
    // Formatage de la date
    const dateOptions = { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    };
    const formattedDate = entry.date.toLocaleDateString('fr-FR', dateOptions);
    
    document.getElementById('History_Inventory_detailDateTime').textContent = formattedDate;
    
    document.getElementById('History_Inventory_detailAction').innerHTML = `
        <span class="History_Inventory_actionBadge History_Inventory_${entry.action.badgeClass}">
            <i class="fas fa-${entry.action.icon} me-1"></i> ${entry.action.label}
        </span>
    `;
    
    document.getElementById('History_Inventory_detailProduct').textContent = `${entry.product.name} (${entry.product.code})`;
    
    document.getElementById('History_Inventory_detailAdmin').innerHTML = `
        <div class="History_Inventory_adminInfo">
            <div class="History_Inventory_adminAvatar" style="background-color: ${entry.admin.color}">
                ${entry.admin.initials}
            </div>
            <div>
                <div class="History_Inventory_adminName">${entry.admin.name}</div>
                <span class="admin-badge ${entry.admin.badge}">
                    <i class="fas fa-${entry.admin.icon} me-1"></i> ${entry.admin.badgeLabel}
                </span>
            </div>
        </div>
    `;
    
    document.getElementById('History_Inventory_detailID').textContent = entry.id;
    
    // Détails spécifiques selon le type d'action
    let detailsHtml = '';
    
    switch(entry.action.type) {
        case "add":
            detailsHtml = `
                <div>
                    <div class="mb-2"><i class="fas fa-plus-circle me-2 text-success"></i> Produit ajouté à l'inventaire :</div>
                    <div class="History_Inventory_modificationItem">
                        <div class="History_Inventory_modificationField">Quantité</div>
                        <div class="History_Inventory_modificationChange">
                            <span class="History_Inventory_newValue">${entry.details.quantity}</span>
                        </div>
                    </div>
                    <div class="History_Inventory_modificationItem">
                        <div class="History_Inventory_modificationField">Prix unitaire</div>
                        <div class="History_Inventory_modificationChange">
                            <span class="History_Inventory_newValue">${entry.details.price} €</span>
                        </div>
                    </div>
                    <div class="History_Inventory_modificationItem">
                        <div class="History_Inventory_modificationField">Emplacement</div>
                        <div class="History_Inventory_modificationChange">
                            <span class="History_Inventory_newValue">${entry.details.location}</span>
                        </div>
                    </div>
                </div>
            `;
            break;
        case "delete":
            detailsHtml = `
                <div>
                    <div class="mb-2"><i class="fas fa-trash me-2 text-danger"></i> Produit supprimé de l'inventaire :</div>
                    <div class="History_Inventory_modificationItem">
                        <div class="History_Inventory_modificationField">Raison</div>
                        <div class="History_Inventory_modificationChange">
                            <span class="History_Inventory_oldValue">${entry.details.reason}</span>
                        </div>
                    </div>
                </div>
            `;
            break;
        case "modify":
            let modificationsHtml = '';
            entry.details.modifications.forEach(mod => {
                modificationsHtml += `
                    <div class="History_Inventory_modificationItem">
                        <div class="History_Inventory_modificationField">${mod.field}</div>
                        <div class="History_Inventory_modificationChange">
                            <span class="History_Inventory_oldValue">${mod.oldValue}</span>
                            <i class="fas fa-arrow-right mx-2"></i>
                            <span class="History_Inventory_newValue">${mod.newValue}</span>
                        </div>
                    </div>
                `;
            });
            
            detailsHtml = `
                <div>
                    <div class="History_Inventory_modificationTitle">
                        <i class="fas fa-edit me-2 text-primary"></i> Modifications apportées :
                    </div>
                    ${modificationsHtml}
                </div>
            `;
            break;
        case "sale":
            detailsHtml = `
                <div>
                    <div class="mb-2"><i class="fas fa-shopping-cart me-2 text-warning"></i> Produit vendu :</div>
                    <div class="History_Inventory_modificationItem">
                        <div class="History_Inventory_modificationField">Quantité</div>
                        <div class="History_Inventory_modificationChange">
                            <span class="History_Inventory_oldValue">${entry.details.quantity}</span>
                        </div>
                    </div>
                    <div class="History_Inventory_modificationItem">
                        <div class="History_Inventory_modificationField">Prix unitaire</div>
                        <div class="History_Inventory_modificationChange">
                            <span class="History_Inventory_oldValue">${entry.details.unitPrice}</span>
                        </div>
                    </div>
                    <div class="History_Inventory_modificationItem">
                        <div class="History_Inventory_modificationField">Prix total</div>
                        <div class="History_Inventory_modificationChange">
                            <span class="History_Inventory_oldValue">${entry.details.totalPrice}</span>
                        </div>
                    </div>
                </div>
            `;
            break;
        case "print":
            detailsHtml = `
                <div>
                    <div class="mb-2"><i class="fas fa-print me-2 text-secondary"></i> Code(s) imprimé(s) :</div>
                    <div class="History_Inventory_modificationItem">
                        <div class="History_Inventory_modificationField">Type de code</div>
                        <div class="History_Inventory_modificationChange">
                            <span class="History_Inventory_newValue">${entry.details.codeType}</span>
                        </div>
                    </div>
                    <div class="History_Inventory_modificationItem">
                        <div class="History_Inventory_modificationField">Quantité</div>
                        <div class="History_Inventory_modificationChange">
                            <span class="History_Inventory_newValue">${entry.details.quantity}</span>
                        </div>
                    </div>
                </div>
            `;
            break;
    }
    
    document.getElementById('History_Inventory_detailInfo').innerHTML = detailsHtml;
    
    modal.show();
}

// Aller à une page spécifique
function History_Inventory_goToPage(pageNumber) {
    History_Inventory_currentPage = pageNumber;
    History_Inventory_updateTable();
    History_Inventory_updatePagination();
}

// Mettre à jour le nombre total de pages
function History_Inventory_updateTotalPages() {
    History_Inventory_totalPages = Math.max(1, Math.ceil(History_Inventory_filteredData.length / History_Inventory_pageSize));
    if (History_Inventory_currentPage > History_Inventory_totalPages) {
        History_Inventory_currentPage = History_Inventory_totalPages;
    }
}

// Appliquer les filtres
function History_Inventory_applyFilters() {
    History_Inventory_filteredData = History_Inventory_data.filter(entry => {
        // Filtre de recherche
        if (History_Inventory_filters.search) {
            const searchLower = History_Inventory_filters.search.toLowerCase();
            const productMatch = entry.product.name.toLowerCase().includes(searchLower) || 
                               entry.product.code.toLowerCase().includes(searchLower);
            const adminMatch = entry.admin.name.toLowerCase().includes(searchLower);
            const actionMatch = entry.action.label.toLowerCase().includes(searchLower);
            
            if (!productMatch && !adminMatch && !actionMatch) {
                return false;
            }
        }
        
        // Filtre de période
        if (History_Inventory_filters.period !== 'all') {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            
            const entryDate = new Date(entry.date);
            
            switch(History_Inventory_filters.period) {
                case 'today':
                    const todayEnd = new Date(today);
                    todayEnd.setHours(23, 59, 59, 999);
                    if (entryDate < today || entryDate > todayEnd) {
                        return false;
                    }
                    break;
                case 'week':
                    const weekStart = new Date(today);
                    weekStart.setDate(today.getDate() - today.getDay() + (today.getDay() === 0 ? -6 : 1)); // Lundi de la semaine courante
                    const weekEnd = new Date(weekStart);
                    weekEnd.setDate(weekStart.getDate() + 6);
                    weekEnd.setHours(23, 59, 59, 999);
                    
                    if (entryDate < weekStart || entryDate > weekEnd) {
                        return false;
                    }
                    break;
                case 'month':
                    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
                    const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59, 999);
                    
                    if (entryDate < monthStart || entryDate > monthEnd) {
                        return false;
                    }
                    break;
                case 'year':
                    const yearStart = new Date(today.getFullYear(), 0, 1);
                    const yearEnd = new Date(today.getFullYear(), 11, 31, 23, 59, 59, 999);
                    
                    if (entryDate < yearStart || entryDate > yearEnd) {
                        return false;
                    }
                    break;
                case 'custom':
                    // Filtre par dates personnalisées
                    if (History_Inventory_filters.startDate && History_Inventory_filters.endDate) {
                        const startDate = new Date(History_Inventory_filters.startDate);
                        const endDate = new Date(History_Inventory_filters.endDate);
                        endDate.setHours(23, 59, 59, 999);
                        
                        if (entryDate < startDate || entryDate > endDate) {
                            return false;
                        }
                    }
                    // Filtre par mois et année spécifiques
                    else if (History_Inventory_filters.month !== null && History_Inventory_filters.year) {
                        if (entryDate.getMonth() !== History_Inventory_filters.month || 
                            entryDate.getFullYear() !== History_Inventory_filters.year) {
                            return false;
                        }
                    }
                    break;
            }
        }
        
        // Filtre de type d'action
        if (History_Inventory_filters.type !== 'all' && entry.action.type !== History_Inventory_filters.type) {
            return false;
        }
        
        // Filtre d'admin
        if (History_Inventory_filters.admin !== 'all') {
            const adminId = History_Inventory_filters.admin;
            
            if ((adminId === 'admin1' && entry.admin.name !== 'Admin Principal') ||
                (adminId === 'admin2' && entry.admin.name !== 'Jean Dupont')) {
                return false;
            }
        }
        
        // Filtre de jour de la semaine
        if (History_Inventory_filters.day !== 'all') {
            const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
            const entryDay = days[entry.date.getDay()];
            
            if (entryDay !== History_Inventory_filters.day) {
                return false;
            }
        }
        
        return true;
    });
    
    History_Inventory_currentPage = 1;
    History_Inventory_updateTotalPages();
    History_Inventory_updateTable();
    History_Inventory_updatePagination();
}

// Réinitialiser les filtres
function History_Inventory_resetFilters() {
    History_Inventory_filters = {
        search: '',
        period: 'all',
        type: 'all',
        admin: 'all',
        day: 'all',
        startDate: null,
        endDate: null,
        month: null,
        year: 2025
    };
    
    // Réinitialiser les éléments d'interface
    document.getElementById('History_Inventory_searchInput').value = '';
    document.getElementById('History_Inventory_periodSelector').innerHTML = '<i class="fas fa-calendar-alt me-2"></i> Période: Tout <i class="fas fa-chevron-down float-end mt-1"></i>';
    document.getElementById('History_Inventory_typeSelector').innerHTML = '<i class="fas fa-tasks me-2"></i> Type d\'action: Tous <i class="fas fa-chevron-down float-end mt-1"></i>';
    document.getElementById('History_Inventory_adminSelector').innerHTML = '<i class="fas fa-user-shield me-2"></i> Admin: Tous <i class="fas fa-chevron-down float-end mt-1"></i>';
    document.getElementById('History_Inventory_daySelector').innerHTML = '<i class="fas fa-calendar-day me-2"></i> Jour: Tous <i class="fas fa-chevron-down float-end mt-1"></i>';
    document.getElementById('History_Inventory_monthSelector').innerHTML = '<i class="fas fa-calendar-alt me-2"></i> Sélectionner <i class="fas fa-chevron-down float-end mt-1"></i>';
    document.getElementById('History_Inventory_yearSelector').innerHTML = '<i class="fas fa-calendar me-2"></i> 2025 <i class="fas fa-chevron-down float-end mt-1"></i>';
    document.getElementById('History_Inventory_startDate').value = '';
    document.getElementById('History_Inventory_endDate').value = '';
    
    // Masquer les filtres avancés
    document.getElementById('History_Inventory_advancedFilters').style.display = 'none';
    document.getElementById('History_Inventory_customDateContainer').style.display = 'none';
    
    // Réinitialiser les données filtrées
    History_Inventory_filteredData = [...History_Inventory_data];
    History_Inventory_currentPage = 1;
    History_Inventory_updateTotalPages();
    History_Inventory_updateTable();
    History_Inventory_updatePagination();
}

// Exporter les données
function History_Inventory_exportData() {
    // Simuler un téléchargement
    showNotification('Exportation', 'L\'historique a été exporté avec succès.', 'success');
}

// Supprimer des entrées de l'historique
function History_Inventory_deleteEntries(entries) {
    // Dans une vraie application, on supprimerait les entrées de la base de données
    // Ici, on simule la suppression dans notre tableau de données
    
    if (entries === 'all') {
        // Supprimer toutes les entrées
        History_Inventory_data = [];
        History_Inventory_filteredData = [];
    } else if (entries === 'filtered') {
        // Supprimer les entrées filtrées
        const filteredIds = History_Inventory_filteredData.map(entry => entry.id);
        History_Inventory_data = History_Inventory_data.filter(entry => !filteredIds.includes(entry.id));
        History_Inventory_filteredData = [];
    } else if (entries === 'selected') {
        // Supprimer les entrées sélectionnées
        const selectedIds = [];
        document.querySelectorAll('.History_Inventory_entryCheckbox:checked').forEach(checkbox => {
            selectedIds.push(checkbox.getAttribute('data-id'));
        });
        
        History_Inventory_data = History_Inventory_data.filter(entry => !selectedIds.includes(entry.id));
        History_Inventory_filteredData = History_Inventory_filteredData.filter(entry => !selectedIds.includes(entry.id));
    } else if (entries === 'week' || entries === 'month' || entries === 'year') {
        // Supprimer par période
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        let startDate, endDate;
        
        if (entries === 'week') {
            startDate = new Date(today);
            startDate.setDate(today.getDate() - today.getDay() + (today.getDay() === 0 ? -6 : 1)); // Lundi de la semaine courante
            endDate = new Date(startDate);
            endDate.setDate(startDate.getDate() + 6);
            endDate.setHours(23, 59, 59, 999);
        } else if (entries === 'month') {
            startDate = new Date(today.getFullYear(), today.getMonth(), 1);
            endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59, 999);
        } else if (entries === 'year') {
            startDate = new Date(today.getFullYear(), 0, 1);
            endDate = new Date(today.getFullYear(), 11, 31, 23, 59, 59, 999);
        }
        
        History_Inventory_data = History_Inventory_data.filter(entry => {
            const entryDate = entry.date;
            return entryDate < startDate || entryDate > endDate;
        });
        
        History_Inventory_filteredData = History_Inventory_filteredData.filter(entry => {
            const entryDate = entry.date;
            return entryDate < startDate || entryDate > endDate;
        });
    }
    
    History_Inventory_currentPage = 1;
    History_Inventory_updateTotalPages();
    History_Inventory_updateTable();
    History_Inventory_updatePagination();
    
    showNotification('Suppression', 'Entrées d\'historique supprimées avec succès.', 'success');
}

// Initialiser les sélecteurs personnalisés
function History_Inventory_initCustomSelects() {
    document.querySelectorAll('.History_Inventory_selectedOption').forEach(selected => {
        selected.addEventListener('click', function() {
            const parent = this.parentElement;
            
            // Fermer tous les autres sélecteurs ouverts
            document.querySelectorAll('.History_Inventory_customSelect.active').forEach(select => {
                if (select !== parent) {
                    select.classList.remove('active');
                }
            });
            
            // Toggle l'état actif
            parent.classList.toggle('active');
        });
    });
    
    document.querySelectorAll('.History_Inventory_option').forEach(option => {
        option.addEventListener('click', function() {
            const value = this.getAttribute('data-value');
            const parent = this.closest('.History_Inventory_customSelect');
            const selected = parent.querySelector('.History_Inventory_selectedOption');
            
            // Mettre à jour la valeur sélectionnée
            if (parent.id === 'History_Inventory_periodSelector' || selected.id === 'History_Inventory_periodSelector') {
                History_Inventory_filters.period = value;
                selected.innerHTML = `<i class="fas fa-calendar-alt me-2"></i> Période: ${this.textContent} <i class="fas fa-chevron-down float-end mt-1"></i>`;
                
                // Afficher/masquer les options de date personnalisées
                document.getElementById('History_Inventory_customDateContainer').style.display = value === 'custom' ? 'flex' : 'none';
            } else if (parent.id === 'History_Inventory_typeSelector' || selected.id === 'History_Inventory_typeSelector') {
                History_Inventory_filters.type = value;
                selected.innerHTML = `<i class="fas fa-tasks me-2"></i> Type d'action: ${this.textContent} <i class="fas fa-chevron-down float-end mt-1"></i>`;
            } else if (parent.id === 'History_Inventory_adminSelector' || selected.id === 'History_Inventory_adminSelector') {
                History_Inventory_filters.admin = value;
                selected.innerHTML = `<i class="fas fa-user-shield me-2"></i> Admin: ${this.textContent} <i class="fas fa-chevron-down float-end mt-1"></i>`;
            } else if (parent.id === 'History_Inventory_daySelector' || selected.id === 'History_Inventory_daySelector') {
                History_Inventory_filters.day = value;
                selected.innerHTML = `<i class="fas fa-calendar-day me-2"></i> Jour: ${this.textContent} <i class="fas fa-chevron-down float-end mt-1"></i>`;
            } else if (parent.id === 'History_Inventory_monthSelector' || selected.id === 'History_Inventory_monthSelector') {
                History_Inventory_filters.month = value !== 'all' ? parseInt(value) : null;
                selected.innerHTML = `<i class="fas fa-calendar-alt me-2"></i> ${this.textContent} <i class="fas fa-chevron-down float-end mt-1"></i>`;
            } else if (parent.id === 'History_Inventory_yearSelector' || selected.id === 'History_Inventory_yearSelector') {
                History_Inventory_filters.year = parseInt(value);
                selected.innerHTML = `<i class="fas fa-calendar me-2"></i> ${this.textContent} <i class="fas fa-chevron-down float-end mt-1"></i>`;
            } else if (parent.id === 'History_Inventory_pageSizeSelector' || selected.id === 'History_Inventory_pageSizeSelector') {
                History_Inventory_pageSize = parseInt(value);
                selected.innerHTML = `${value} <i class="fas fa-chevron-down ms-1"></i>`;
                History_Inventory_updateTotalPages();
                History_Inventory_updateTable();
                History_Inventory_updatePagination();
            }
            
            // Fermer le dropdown
            parent.classList.remove('active');
        });
    });
    
    // Fermer les sélecteurs au clic en dehors
    document.addEventListener('click', function(event) {
        if (!event.target.closest('.History_Inventory_customSelect')) {
            document.querySelectorAll('.History_Inventory_customSelect.active').forEach(select => {
                select.classList.remove('active');
            });
        }
    });
}

// Initialiser les événements
function History_Inventory_initEvents() {
    // Bouton de toggle des filtres
    document.getElementById('History_Inventory_toggleFilters').addEventListener('click', function() {
        const filtersContainer = document.getElementById('History_Inventory_filtersContainer');
        filtersContainer.style.display = filtersContainer.style.display === 'none' ? 'block' : 'none';
        this.innerHTML = filtersContainer.style.display === 'none' ? 
            '<i class="fas fa-sliders-h me-1"></i> Options de filtrage' : 
            '<i class="fas fa-times me-1"></i> Masquer les filtres';
    });
    
    // Bouton pour afficher/masquer les filtres avancés
    document.getElementById('History_Inventory_showAdvancedFilters').addEventListener('click', function() {
        const advancedFilters = document.getElementById('History_Inventory_advancedFilters');
        advancedFilters.style.display = advancedFilters.style.display === 'none' ? 'block' : 'none';
        this.innerHTML = advancedFilters.style.display === 'none' ? 
            '<i class="fas fa-cogs me-1"></i> Filtres avancés' : 
            '<i class="fas fa-times me-1"></i> Masquer filtres avancés';
    });
    
    // Recherche
    document.getElementById('History_Inventory_searchInput').addEventListener('input', function() {
        History_Inventory_filters.search = this.value;
    });
    
    // Filtres de date
    document.getElementById('History_Inventory_startDate').addEventListener('change', function() {
        History_Inventory_filters.startDate = this.value;
    });
    
    document.getElementById('History_Inventory_endDate').addEventListener('change', function() {
        History_Inventory_filters.endDate = this.value;
    });
    
    // Bouton d'application des filtres
    document.getElementById('History_Inventory_applyFilters').addEventListener('click', function() {
        History_Inventory_applyFilters();
    });
    
    // Bouton de réinitialisation des filtres
    document.getElementById('History_Inventory_resetFilters').addEventListener('click', function() {
        History_Inventory_resetFilters();
    });
    
    // Boutons de pagination
    document.getElementById('History_Inventory_firstPage').addEventListener('click', function() {
        if (!this.disabled) {
            History_Inventory_goToPage(1);
        }
    });
    
    document.getElementById('History_Inventory_prevPage').addEventListener('click', function() {
        if (!this.disabled) {
            History_Inventory_goToPage(History_Inventory_currentPage - 1);
        }
    });
    
    document.getElementById('History_Inventory_nextPage').addEventListener('click', function() {
        if (!this.disabled) {
            History_Inventory_goToPage(History_Inventory_currentPage + 1);
        }
    });
    
    document.getElementById('History_Inventory_lastPage').addEventListener('click', function() {
        if (!this.disabled) {
            History_Inventory_goToPage(History_Inventory_totalPages);
        }
    });
    
    // Bouton d'exportation
    document.getElementById('History_Inventory_exportBtn').addEventListener('click', function() {
        History_Inventory_exportData();
    });
    
    // Sélection/Désélection de toutes les entrées
    document.getElementById('History_Inventory_selectAll').addEventListener('change', function() {
        const isChecked = this.checked;
        document.querySelectorAll('.History_Inventory_entryCheckbox').forEach(checkbox => {
            checkbox.checked = isChecked;
        });
    });
    
    // Boutons de suppression
    document.getElementById('History_Inventory_deleteBtn').addEventListener('click', function() {
        const selectedCount = document.querySelectorAll('.History_Inventory_entryCheckbox:checked').length;
        
        if (selectedCount === 0) {
            showNotification('Attention', 'Veuillez sélectionner au moins une entrée à supprimer.', 'warning');
            return;
        }
        
        document.getElementById('History_Inventory_deleteCount').textContent = `ces ${selectedCount}`;
        const deleteModal = new bootstrap.Modal(document.getElementById('History_Inventory_deleteModal'));
        deleteModal.show();
        
        document.getElementById('History_Inventory_confirmDelete').onclick = function() {
            History_Inventory_deleteEntries('selected');
            deleteModal.hide();
        };
    });
    
    document.getElementById('History_Inventory_deleteAll').addEventListener('click', function() {
        document.getElementById('History_Inventory_deleteCount').textContent = 'toutes les';
        const deleteModal = new bootstrap.Modal(document.getElementById('History_Inventory_deleteModal'));
        deleteModal.show();
        
        document.getElementById('History_Inventory_confirmDelete').onclick = function() {
            History_Inventory_deleteEntries('all');
            deleteModal.hide();
        };
    });
    
    document.getElementById('History_Inventory_deleteFiltered').addEventListener('click', function() {
        const count = History_Inventory_filteredData.length;
        
        if (count === 0) {
            showNotification('Attention', 'Aucune entrée ne correspond aux filtres actuels.', 'warning');
            return;
        }
        
        document.getElementById('History_Inventory_deleteCount').textContent = `ces ${count}`;
        const deleteModal = new bootstrap.Modal(document.getElementById('History_Inventory_deleteModal'));
        deleteModal.show();
        
        document.getElementById('History_Inventory_confirmDelete').onclick = function() {
            History_Inventory_deleteEntries('filtered');
            deleteModal.hide();
        };
    });
    
    document.getElementById('History_Inventory_deleteWeek').addEventListener('click', function() {
        document.getElementById('History_Inventory_deleteCount').textContent = 'toutes les entrées de cette semaine';
        const deleteModal = new bootstrap.Modal(document.getElementById('History_Inventory_deleteModal'));
        deleteModal.show();
        
        document.getElementById('History_Inventory_confirmDelete').onclick = function() {
            History_Inventory_deleteEntries('week');
            deleteModal.hide();
        };
    });
    
    document.getElementById('History_Inventory_deleteMonth').addEventListener('click', function() {
        document.getElementById('History_Inventory_deleteCount').textContent = 'toutes les entrées de ce mois';
        const deleteModal = new bootstrap.Modal(document.getElementById('History_Inventory_deleteModal'));
        deleteModal.show();
        
        document.getElementById('History_Inventory_confirmDelete').onclick = function() {
            History_Inventory_deleteEntries('month');
            deleteModal.hide();
        };
    });
    
    document.getElementById('History_Inventory_deleteYear').addEventListener('click', function() {
        document.getElementById('History_Inventory_deleteCount').textContent = 'toutes les entrées de cette année';
        const deleteModal = new bootstrap.Modal(document.getElementById('History_Inventory_deleteModal'));
        deleteModal.show();
        
        document.getElementById('History_Inventory_confirmDelete').onclick = function() {
            History_Inventory_deleteEntries('year');
            deleteModal.hide();
        };
    });
}

// Initialisation de la section historique
document.addEventListener('DOMContentLoaded', function() {
    // Ajouter l'événement pour charger l'historique quand on clique sur l'onglet
    document.querySelector('[data-section="History_Inventory_section"]').addEventListener('click', function() {
        if (History_Inventory_data.length === 0) {
            History_Inventory_initData();
            History_Inventory_initCustomSelects();
            History_Inventory_initEvents();
        }
        History_Inventory_loadData();
    });
});

    

/*══════════════════════════════╗
  🔵 JS PARTIE 2
  ═════════════════════════════╝*/

// Initialisation de Supabase
const SUPABASE_URL = 'https://yeixjuxaqsogqzyxkyjq.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InllaXhqdXhhcXNvZ3F6eXhreWpxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY0NjE3NjcsImV4cCI6MjA2MjAzNzc2N30.InBGi-tId4NCloYoxIdaVUd8shV02ItcbXmxod6705s';
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// Système d'authentification et gestion des administrateurs
document.addEventListener('DOMContentLoaded', async function() {
    // Variables pour stocker les informations des administrateurs
    let admins = [];
    let currentAdmin = null;
    
    // Fonction pour hasher un mot de passe avec SHA-256
    async function hashPassword(password) {
        const encoder = new TextEncoder();
        const data = encoder.encode(password);
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
        return hashHex;
    }
    
    // Vérifier si la table des administrateurs existe déjà
    async function checkAdminTable() {
        try {
            const { data, error } = await supabase
                .from('administrators')
                .select('id')
                .limit(1);
                
            if (error) {
                console.error('Erreur lors de la vérification de la table:', error);
                // Si la table n'existe pas, tentez de la créer
                await createAdminTable();
            }
        } catch (err) {
            console.error('Erreur lors de la vérification de la table:', err);
            // En cas d'erreur, tentez de créer la table
            await createAdminTable();
        }
    }
    
    // Créer la table des administrateurs si elle n'existe pas
    async function createAdminTable() {
        try {
            // Ceci nécessite des droits d'administrateur sur Supabase
            // Cette opération devrait idéalement être faite via l'interface Supabase
            console.log('Veuillez créer la table "administrators" via l\'interface Supabase');
            
            // La structure recommandée pour la table administrators:
            /*
            Table: administrators
            Colonnes:
            - id (uuid, primary key)
            - username (text, unique)
            - password (text)
            - role (text) - 'primary' ou 'standard'
            - created_at (timestamp with time zone)
            - last_login (timestamp with time zone, nullable)
            - online (boolean)
            */
        } catch (err) {
            console.error('Erreur lors de la création de la table:', err);
            showNotification('Erreur de configuration de la base de données', 'danger');
        }
    }
    
    // Charger les administrateurs depuis Supabase
    async function loadAdmins() {
        try {
            const { data, error } = await supabase
                .from('administrators')
                .select('*');
                
            if (error) {
                console.error('Erreur lors du chargement des administrateurs:', error);
                return [];
            }
            
            return data || [];
        } catch (err) {
            console.error('Erreur lors du chargement des administrateurs:', err);
            return [];
        }
    }
    
    // Vérifier si c'est la première connexion
    async function checkFirstLogin() {
        await checkAdminTable();
        admins = await loadAdmins();
        
        if(admins.length === 0) {
            // Première connexion - afficher le formulaire de création d'admin
            document.getElementById('first-login').style.display = 'block';
            document.getElementById('login').style.display = 'none';
        } else {
            // Connexion standard
            document.getElementById('first-login').style.display = 'none';
            document.getElementById('login').style.display = 'block';
        }
    }
    
    // Gestion de la première connexion
    document.getElementById('first-login-form').addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const username = document.getElementById('admin-username').value;
        const password = document.getElementById('admin-password').value;
        const passwordConfirm = document.getElementById('admin-password-confirm').value;
        
        // Vérification de la correspondance des mots de passe
        if(password !== passwordConfirm) {
            showNotification('Les mots de passe ne correspondent pas', 'danger');
            return;
        }
        
        // Vérification de la force du mot de passe
        if(calculatePasswordStrength(password) < 80) {
            showNotification('Veuillez utiliser un mot de passe plus fort', 'warning');
            return;
        }
        
        try {
            // Hachage du mot de passe
            const hashedPassword = await hashPassword(password);
            
            // Création de l'administrateur principal dans Supabase
            const { data, error } = await supabase
                .from('administrators')
                .insert([
                    {
                        username: username,
                        password: hashedPassword,
                        role: 'primary',
                        created_at: new Date().toISOString(),
                        last_login: new Date().toISOString(),
                        online: true
                    }
                ])
                .select();
                
            if (error) {
                console.error('Erreur lors de la création de l\'administrateur:', error);
                showNotification('Erreur lors de la création du compte administrateur', 'danger');
                return;
            }
            
            // Connexion de l'admin
            currentAdmin = data[0];
            localStorage.setItem('currentAdminId', currentAdmin.id);
            
            // Afficher l'interface principale
            document.getElementById('auth-container').style.display = 'none';
            showNotification('Compte administrateur créé avec succès!', 'success');
            updateAdminUI();
        } catch (err) {
            console.error('Erreur lors de la création de l\'administrateur:', err);
            showNotification('Une erreur est survenue', 'danger');
        }
    });
    
    // Gestion de la connexion standard
    document.getElementById('login-form').addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const username = document.getElementById('login-username').value;
        const password = document.getElementById('login-password').value;
        
        try {
            // Hachage du mot de passe pour comparaison
            const hashedPassword = await hashPassword(password);
            
            // Recherche de l'administrateur
            const { data, error } = await supabase
                .from('administrators')
                .select('*')
                .eq('username', username);
                
            if (error) {
                console.error('Erreur lors de la recherche de l\'administrateur:', error);
                showNotification('Erreur lors de la connexion', 'danger');
                return;
            }
            
            const admin = data && data.length > 0 ? data[0] : null;
            
            if (admin && admin.password === hashedPassword) {
                // Mise à jour des informations de connexion
                const { error: updateError } = await supabase
                    .from('administrators')
                    .update({
                        last_login: new Date().toISOString(),
                        online: true
                    })
                    .eq('id', admin.id);
                    
                if (updateError) {
                    console.error('Erreur lors de la mise à jour des infos de connexion:', updateError);
                }
                
                // Connexion de l'admin
                currentAdmin = admin;
                localStorage.setItem('currentAdminId', currentAdmin.id);
                
                // Afficher l'interface principale
                document.getElementById('auth-container').style.display = 'none';
                showNotification('Connexion réussie!', 'success');
                updateAdminUI();
            } else {
                showNotification('Nom d\'utilisateur ou mot de passe incorrect', 'danger');
            }
        } catch (err) {
            console.error('Erreur lors de la connexion:', err);
            showNotification('Une erreur est survenue', 'danger');
        }
    });
    
    // Gestion de la création d'un nouvel administrateur
    document.getElementById('add-admin-form').addEventListener('submit', async function(e) {
        e.preventDefault();
        
        if(currentAdmin.role !== 'primary') {
            showNotification('Seul l\'administrateur principal peut ajouter des administrateurs', 'danger');
            return;
        }
        
        const username = document.getElementById('new-admin-username').value;
        const password = document.getElementById('new-admin-password').value;
        
        try {
            // Vérification si le nom d'utilisateur existe déjà
            const { data: existingAdmin, error: checkError } = await supabase
                .from('administrators')
                .select('id')
                .eq('username', username)
                .maybeSingle();
                
            if (checkError) {
                console.error('Erreur lors de la vérification du nom d\'utilisateur:', checkError);
                showNotification('Erreur lors de la vérification du nom d\'utilisateur', 'danger');
                return;
            }
            
            if (existingAdmin) {
                showNotification('Ce nom d\'utilisateur existe déjà', 'danger');
                return;
            }
            
            // Hachage du mot de passe
            const hashedPassword = await hashPassword(password);
            
            // Création du nouvel administrateur
            const { data, error } = await supabase
                .from('administrators')
                .insert([
                    {
                        username: username,
                        password: hashedPassword,
                        role: 'standard',
                        created_at: new Date().toISOString(),
                        last_login: null,
                        online: false
                    }
                ]);
                
            if (error) {
                console.error('Erreur lors de la création de l\'administrateur:', error);
                showNotification('Erreur lors de la création de l\'administrateur', 'danger');
                return;
            }
            
            // Réinitialisation du formulaire
            document.getElementById('add-admin-form').reset();
            
            // Mise à jour de l'interface
            admins = await loadAdmins();
            refreshAdminList();
            showNotification('Administrateur ajouté avec succès!', 'success');
        } catch (err) {
            console.error('Erreur lors de la création de l\'administrateur:', err);
            showNotification('Une erreur est survenue', 'danger');
        }
    });
    
    // Génération d'un mot de passe aléatoire
    document.getElementById('generate-password').addEventListener('click', function() {
        const password = generateRandomPassword();
        document.getElementById('new-admin-password').value = password;
    });
    
    // Option de changement de mot de passe
    document.getElementById('change-password-option').addEventListener('click', function() {
        const modal = new bootstrap.Modal(document.getElementById('changePasswordModal'));
        modal.show();
    });
    
    // Option de changement de nom d'utilisateur
    document.getElementById('change-username-option').addEventListener('click', function() {
        document.getElementById('current-username').value = currentAdmin.username;
        const modal = new bootstrap.Modal(document.getElementById('changeUsernameModal'));
        modal.show();
    });
    
    // Option de déconnexion
    document.getElementById('logout-option').addEventListener('click', function() {
        const modal = new bootstrap.Modal(document.getElementById('logoutModal'));
        modal.show();
    });
    
    // Confirmation de déconnexion
    document.getElementById('confirm-logout').addEventListener('click', async function() {
        try {
            // Mettre à jour le statut de connexion
            if (currentAdmin) {
                const { error } = await supabase
                    .from('administrators')
                    .update({ online: false })
                    .eq('id', currentAdmin.id);
                    
                if (error) {
                    console.error('Erreur lors de la mise à jour du statut:', error);
                }
            }
            
            // Déconnexion
            localStorage.removeItem('currentAdminId');
            currentAdmin = null;
            
            // Afficher l'écran de connexion
            document.getElementById('auth-container').style.display = 'flex';
            await checkFirstLogin();
            
            // Fermer la modale
            const modal = bootstrap.Modal.getInstance(document.getElementById('logoutModal'));
            modal.hide();
        } catch (err) {
            console.error('Erreur lors de la déconnexion:', err);
            showNotification('Une erreur est survenue', 'danger');
        }
    });
    
    // Sauvegarde du nouveau mot de passe
    document.getElementById('save-new-password').addEventListener('click', async function() {
        const currentPassword = document.getElementById('current-password').value;
        const newPassword = document.getElementById('new-password').value;
        const confirmNewPassword = document.getElementById('confirm-new-password').value;
        
        try {
            // Hachage du mot de passe actuel pour vérification
            const hashedCurrentPassword = await hashPassword(currentPassword);
            
            // Vérification du mot de passe actuel
            if(hashedCurrentPassword !== currentAdmin.password) {
                showNotification('Le mot de passe actuel est incorrect', 'danger');
                return;
            }
            
            // Vérification de la correspondance des nouveaux mots de passe
            if(newPassword !== confirmNewPassword) {
                showNotification('Les nouveaux mots de passe ne correspondent pas', 'danger');
                return;
            }
            
            // Vérification de la force du mot de passe
            if(calculatePasswordStrength(newPassword) < 60) {
                showNotification('Veuillez utiliser un mot de passe plus fort', 'warning');
                return;
            }
            
            // Hachage du nouveau mot de passe
            const hashedNewPassword = await hashPassword(newPassword);
            
            // Mise à jour du mot de passe dans Supabase
            const { error } = await supabase
                .from('administrators')
                .update({ password: hashedNewPassword })
                .eq('id', currentAdmin.id);
                
            if (error) {
                console.error('Erreur lors de la mise à jour du mot de passe:', error);
                showNotification('Erreur lors de la mise à jour du mot de passe', 'danger');
                return;
            }
            
            // Mise à jour de l'admin actuel
            currentAdmin.password = hashedNewPassword;
            
            // Fermer la modale
            const modal = bootstrap.Modal.getInstance(document.getElementById('changePasswordModal'));
            modal.hide();
            
            // Réinitialiser le formulaire
            document.getElementById('change-password-form').reset();
            
            showNotification('Mot de passe modifié avec succès!', 'success');
        } catch (err) {
            console.error('Erreur lors du changement de mot de passe:', err);
            showNotification('Une erreur est survenue', 'danger');
        }
    });
    
    // Sauvegarde du nouveau nom d'utilisateur
    document.getElementById('save-new-username').addEventListener('click', async function() {
        const newUsername = document.getElementById('new-username').value;
        const confirmPassword = document.getElementById('confirm-password').value;
        
        try {
            // Hachage du mot de passe pour vérification
            const hashedPassword = await hashPassword(confirmPassword);
            
            // Vérification du mot de passe
            if(hashedPassword !== currentAdmin.password) {
                showNotification('Le mot de passe est incorrect', 'danger');
                return;
            }
            
            // Vérification si le nom d'utilisateur existe déjà
            const { data: existingAdmin, error: checkError } = await supabase
                .from('administrators')
                .select('id')
                .eq('username', newUsername)
                .neq('id', currentAdmin.id)
                .maybeSingle();
                
            if (checkError) {
                console.error('Erreur lors de la vérification du nom d\'utilisateur:', checkError);
                showNotification('Erreur lors de la vérification du nom d\'utilisateur', 'danger');
                return;
            }
            
            if (existingAdmin) {
                showNotification('Ce nom d\'utilisateur existe déjà', 'danger');
                return;
            }
            
            // Mise à jour du nom d'utilisateur
            const { error } = await supabase
                .from('administrators')
                .update({ username: newUsername })
                .eq('id', currentAdmin.id);
                
            if (error) {
                console.error('Erreur lors de la mise à jour du nom d\'utilisateur:', error);
                showNotification('Erreur lors de la mise à jour du nom d\'utilisateur', 'danger');
                return;
            }
            
            // Mise à jour de l'admin actuel
            currentAdmin.username = newUsername;
            
            // Fermer la modale
            const modal = bootstrap.Modal.getInstance(document.getElementById('changeUsernameModal'));
            modal.hide();
            
            // Réinitialiser le formulaire
            document.getElementById('change-username-form').reset();
            
            // Mise à jour de l'interface
            updateAdminUI();
            showNotification('Nom d\'utilisateur modifié avec succès!', 'success');
        } catch (err) {
            console.error('Erreur lors du changement de nom d\'utilisateur:', err);
            showNotification('Une erreur est survenue', 'danger');
        }
    });
    
    // Gestion de l'édition d'un administrateur
    document.getElementById('admin-list').addEventListener('click', function(e) {
        // Gestion du bouton d'édition
        if(e.target.closest('.admin-btn.edit')) {
            const adminItem = e.target.closest('.admin-item');
            const adminId = adminItem.dataset.adminId;
            
            // Recherche de l'administrateur dans la liste
            const admin = admins.find(a => a.id === adminId);
            if (!admin) return;
            
            // Ne pas permettre la modification de l'admin principal par lui-même
            if(admin.role === 'primary' && currentAdmin.role === 'primary') {
                document.getElementById('edit-admin-id').value = adminId;
                document.getElementById('edit-admin-username').value = admin.username;
                
                // Réinitialiser l'option de réinitialisation de mot de passe
                document.getElementById('reset-admin-password').checked = false;
                document.getElementById('reset-password-container').style.display = 'none';
                
                const modal = new bootstrap.Modal(document.getElementById('editAdminModal'));
                modal.show();
            } else if(currentAdmin.role === 'primary') {
                // Modification d'un admin standard par l'admin principal
                document.getElementById('edit-admin-id').value = adminId;
                document.getElementById('edit-admin-username').value = admin.username;
                
                // Réinitialiser l'option de réinitialisation de mot de passe
                document.getElementById('reset-admin-password').checked = false;
                document.getElementById('reset-password-container').style.display = 'none';
                
                const modal = new bootstrap.Modal(document.getElementById('editAdminModal'));
                modal.show();
            } else {
                showNotification('Vous n\'avez pas les droits pour modifier cet administrateur', 'danger');
            }
        }
        
        // Gestion du bouton de suppression
        if(e.target.closest('.admin-btn.delete')) {
            const adminItem = e.target.closest('.admin-item');
            const adminId = adminItem.dataset.adminId;
            
            // Vérifier que l'admin principal ne se supprime pas lui-même
            if(adminId === currentAdmin.id) {
                showNotification('Vous ne pouvez pas supprimer votre propre compte', 'danger');
                return;
            }
            
            // Recherche de l'administrateur dans la liste
            const admin = admins.find(a => a.id === adminId);
            if (!admin) return;
            
            // Vérifier que seul l'admin principal peut supprimer
            if(currentAdmin.role !== 'primary') {
                showNotification('Seul l\'administrateur principal peut supprimer des comptes', 'danger');
                return;
            }
            
            // Afficher la confirmation
            document.getElementById('delete-admin-name').textContent = admin.username;
            document.getElementById('delete-confirm-password').value = '';
            
            const modal = new bootstrap.Modal(document.getElementById('deleteAdminModal'));
            modal.dataset.adminId = adminId;
            modal.show();
        }
    });
    
    // Gestion de la réinitialisation de mot de passe
    document.getElementById('reset-admin-password').addEventListener('change', function() {
        const resetPasswordContainer = document.getElementById('reset-password-container');
        if(this.checked) {
            resetPasswordContainer.style.display = 'block';
            // Générer un mot de passe aléatoire
            document.getElementById('reset-password').value = generateRandomPassword();
        } else {
            resetPasswordContainer.style.display = 'none';
        }
    });
    
    // Génération d'un mot de passe aléatoire pour la réinitialisation
    document.getElementById('generate-reset-password').addEventListener('click', function() {
        const password = generateRandomPassword();
        document.getElementById('reset-password').value = password;
    });
    
    // Sauvegarde des modifications d'un administrateur
    document.getElementById('save-edit-admin').addEventListener('click', async function() {
        const adminId = document.getElementById('edit-admin-id').value;
        const newUsername = document.getElementById('edit-admin-username').value;
        const resetPassword = document.getElementById('reset-admin-password').checked;
        const newPassword = document.getElementById('reset-password').value;
        
        try {
            // Vérification si le nom d'utilisateur existe déjà
            const { data: existingAdmin, error: checkError } = await supabase
                .from('administrators')
                .select('id')
                .eq('username', newUsername)
                .neq('id', adminId)
                .maybeSingle();
                
            if (checkError) {
                console.error('Erreur lors de la vérification du nom d\'utilisateur:', checkError);
                showNotification('Erreur lors de la vérification du nom d\'utilisateur', 'danger');
                return;
            }
            
            if (existingAdmin) {
                showNotification('Ce nom d\'utilisateur existe déjà', 'danger');
                return;
            }
            
            // Préparation des données à mettre à jour
            const updateData = { username: newUsername };
            
            // Si réinitialisation du mot de passe, hacher le nouveau mot de passe
            if (resetPassword) {
                updateData.password = await hashPassword(newPassword);
            }
            
            // Mise à jour de l'administrateur
            const { error } = await supabase
                .from('administrators')
                .update(updateData)
                .eq('id', adminId);
                
            if (error) {
                console.error('Erreur lors de la mise à jour de l\'administrateur:', error);
                showNotification('Erreur lors de la mise à jour de l\'administrateur', 'danger');
                return;
            }
            
            // Mise à jour de l'admin actuel si nécessaire
            if (currentAdmin.id === adminId) {
                currentAdmin.username = newUsername;
                if (resetPassword) {
                    currentAdmin.password = updateData.password;
                }
            }
            
            // Fermer la modale
            const modal = bootstrap.Modal.getInstance(document.getElementById('editAdminModal'));
            modal.hide();
            
            // Recharger la liste des administrateurs et rafraîchir l'interface
            admins = await loadAdmins();
            refreshAdminList();
            updateAdminUI();
            showNotification('Administrateur modifié avec succès!', 'success');
        } catch (err) {
            console.error('Erreur lors de la modification de l\'administrateur:', err);
            showNotification('Une erreur est survenue', 'danger');
        }
    });
    
    // Confirmation de suppression d'un administrateur
    document.getElementById('confirm-delete-admin').addEventListener('click', async function() {
        const modal = bootstrap.Modal.getInstance(document.getElementById('deleteAdminModal'));
        const adminId = modal.dataset.adminId;
        const confirmPassword = document.getElementById('delete-confirm-password').value;
        
        try {
            // Hachage du mot de passe pour vérification
            const hashedPassword = await hashPassword(confirmPassword);
            
            // Vérification du mot de passe
            if(hashedPassword !== currentAdmin.password) {
                showNotification('Le mot de passe est incorrect', 'danger');
                return;
            }
            
            // Suppression de l'administrateur
            const { error } = await supabase
                .from('administrators')
                .delete()
                .eq('id', adminId);
                
            if (error) {
                console.error('Erreur lors de la suppression de l\'administrateur:', error);
                showNotification('Erreur lors de la suppression de l\'administrateur', 'danger');
                return;
            }
            
            // Fermer la modale
            modal.hide();
            
            // Recharger la liste des administrateurs et rafraîchir l'interface
            admins = await loadAdmins();
            refreshAdminList();
            showNotification('Administrateur supprimé avec succès!', 'success');
        } catch (err) {
            console.error('Erreur lors de la suppression de l\'administrateur:', err);
            showNotification('Une erreur est survenue', 'danger');
        }
    });
    
    // Gestion de la force du mot de passe lors de la première connexion
    document.getElementById('admin-password').addEventListener('input', function() {
        updatePasswordStrength(this.value);
    });
    
    // Gestion de la force du mot de passe lors du changement
    document.getElementById('new-password').addEventListener('input', function() {
        updateNewPasswordStrength(this.value);
    });
    
    // Fonction pour mettre à jour la force du mot de passe initial
    function updatePasswordStrength(password) {
        const strength = calculatePasswordStrength(password);
        const bar = document.getElementById('password-strength-bar');
        const text = document.getElementById('password-strength-text');
        const length = document.getElementById('password-length');
        
        // Mise à jour de la barre de progression
        bar.style.width = strength + '%';
        
        // Couleur de la barre selon la force
        if(strength < 40) {
            bar.style.backgroundColor = '#dc3545'; // Rouge
            text.textContent = 'Force: Faible';
        } else if(strength < 80) {
            bar.style.backgroundColor = '#ffc107'; // Jaune
            text.textContent = 'Force: Moyenne';
        } else {
            bar.style.backgroundColor = '#28a745'; // Vert
            text.textContent = 'Force: Forte';
        }
        
        // Mise à jour de la longueur
        length.textContent = password.length + '/12';
        
        // Mise à jour des règles
        updatePasswordRules(password);
    }
    
    // Fonction pour mettre à jour la force du nouveau mot de passe
    function updateNewPasswordStrength(password) {
        const strength = calculatePasswordStrength(password);
        const bar = document.getElementById('new-password-strength-bar');
        const text = document.getElementById('new-password-strength-text');
        const length = document.getElementById('new-password-length');
        
        // Mise à jour de la barre de progression
        bar.style.width = strength + '%';
        
        // Couleur de la barre selon la force
        if(strength < 40) {
            bar.style.backgroundColor = '#dc3545'; // Rouge
            text.textContent = 'Force: Faible';
        } else if(strength < 80) {
            bar.style.backgroundColor = '#ffc107'; // Jaune
            text.textContent = 'Force: Moyenne';
        } else {
            bar.style.backgroundColor = '#28a745'; // Vert
            text.textContent = 'Force: Forte';
        }
        
        // Mise à jour de la longueur
        length.textContent = password.length + '/12';
    }
    
    // Fonction pour mettre à jour les règles de mot de passe
    function updatePasswordRules(password) {
        // Règle de longueur
        const ruleLength = document.getElementById('rule-length');
        if(password.length >= 12) {
            ruleLength.querySelector('.rule-icon').innerHTML = '<i class="fas fa-check-circle text-success"></i>';
        } else {
            ruleLength.querySelector('.rule-icon').innerHTML = '<i class="fas fa-times-circle text-danger"></i>';
        }
        
        // Règle de majuscule
        const ruleUppercase = document.getElementById('rule-uppercase');
        if(/[A-Z]/.test(password)) {
            ruleUppercase.querySelector('.rule-icon').innerHTML = '<i class="fas fa-check-circle text-success"></i>';
        } else {
            ruleUppercase.querySelector('.rule-icon').innerHTML = '<i class="fas fa-times-circle text-danger"></i>';
        }
        
        // Règle de minuscule
        const ruleLowercase = document.getElementById('rule-lowercase');
        if(/[a-z]/.test(password)) {
            ruleLowercase.querySelector('.rule-icon').innerHTML = '<i class="fas fa-check-circle text-success"></i>';
        } else {
            ruleLowercase.querySelector('.rule-icon').innerHTML = '<i class="fas fa-times-circle text-danger"></i>';
        }
        
        // Règle de chiffre
        const ruleNumber = document.getElementById('rule-number');
        if(/[0-9]/.test(password)) {
            ruleNumber.querySelector('.rule-icon').innerHTML = '<i class="fas fa-check-circle text-success"></i>';
        } else {
            ruleNumber.querySelector('.rule-icon').innerHTML = '<i class="fas fa-times-circle text-danger"></i>';
        }
        
        // Règle de caractère spécial
        const ruleSpecial = document.getElementById('rule-special');
        if(/[^A-Za-z0-9]/.test(password)) {
            ruleSpecial.querySelector('.rule-icon').innerHTML = '<i class="fas fa-check-circle text-success"></i>';
        } else {
            ruleSpecial.querySelector('.rule-icon').innerHTML = '<i class="fas fa-times-circle text-danger"></i>';
        }
    }
    
    // Fonction pour calculer la force du mot de passe
    function calculatePasswordStrength(password) {
        if(!password) return 0;
        
        let strength = 0;
        
        // Longueur
        strength += Math.min(password.length * 5, 30);
        
        // Présence de caractères spéciaux
        if(/[^A-Za-z0-9]/.test(password)) strength += 20;
        
        // Présence de chiffres
        if(/[0-9]/.test(password)) strength += 15;
        
        // Présence de majuscules et minuscules
        if(/[A-Z]/.test(password) && /[a-z]/.test(password)) strength += 15;
        
        // Mélange de types de caractères
        if(/[A-Z]/.test(password) && /[a-z]/.test(password) && /[0-9]/.test(password) && /[^A-Za-z0-9]/.test(password)) strength += 20;
        
        return Math.min(strength, 100);
    }
    
    // Fonction pour générer un ID unique
    function generateUniqueId() {
        return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    }
    
    // Fonction pour générer un mot de passe aléatoire
    function generateRandomPassword() {
        const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()-_=+';
        let password = '';
        for(let i = 0; i < 14; i++) {
            password += characters.charAt(Math.floor(Math.random() * characters.length));
        }
        return password;
    }
    
    // Fonction pour formater la date de dernière connexion
    function formatLastLogin(dateString) {
        if(!dateString) return 'Jamais connecté';
        
        const date = new Date(dateString);
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        
        if(date.getDate() === now.getDate() && 
           date.getMonth() === now.getMonth() && 
           date.getFullYear() === now.getFullYear()) {
            return 'Aujourd\'hui ' + date.toLocaleTimeString('fr-FR', {hour: '2-digit', minute: '2-digit'});
        } else if(date.getDate() === yesterday.getDate() && 
                 date.getMonth() === yesterday.getMonth() && 
                 date.getFullYear() === yesterday.getFullYear()) {
            return 'Hier ' + date.toLocaleTimeString('fr-FR', {hour: '2-digit', minute: '2-digit'});
        } else {
            return date.toLocaleDateString('fr-FR') + ' ' + date.toLocaleTimeString('fr-FR', {hour: '2-digit', minute: '2-digit'});
        }
    }
    
    // Fonction pour rafraîchir la liste des administrateurs
    function refreshAdminList() {
        const adminList = document.getElementById('admin-list');
        adminList.innerHTML = '';
        
        admins.forEach(admin => {
            const adminItem = document.createElement('div');
            adminItem.className = 'admin-item';
            adminItem.dataset.adminId = admin.id;
            
            const isPrimary = admin.role === 'primary';
            const isCurrentAdmin = admin.id === currentAdmin.id;
            
            // Badge approprié selon le rôle
            const badgeClass = isPrimary ? 'primary' : 'standard';
            const badgeIcon = isPrimary ? 'crown' : 'user-shield';
            const badgeText = isPrimary ? 'Principal' : 'Standard';
            
            // Affichage du statut en ligne
            const onlineStatusClass = admin.online ? 'online' : 'offline';
            const onlineStatusTitle = admin.online ? 'En ligne' : 'Hors ligne';
            
            // Actions disponibles en fonction des droits
            let actionButtons = '';
            if(currentAdmin.role === 'primary') {
                // L'admin principal peut éditer tous les admins
                actionButtons += `<div class="admin-btn edit" title="Modifier"><i class="fas fa-edit"></i></div>`;
                
                // L'admin principal peut supprimer tous les admins sauf lui-même
                if(!isCurrentAdmin) {
                    actionButtons += `<div class="admin-btn delete" title="Supprimer"><i class="fas fa-trash"></i></div>`;
                }
            } else if(isCurrentAdmin) {
                // Un admin standard peut s'éditer lui-même
                actionButtons += `<div class="admin-btn edit" title="Modifier"><i class="fas fa-edit"></i></div>`;
            }
            
            adminItem.innerHTML = `
                <div class="admin-header">
                    <div class="admin-info">
                        <span class="admin-name">${admin.username}</span>
                        <span class="admin-badge ${badgeClass}">
                            <i class="fas fa-${badgeIcon}"></i> ${badgeText}
                        </span>
                        <span class="online-status ${onlineStatusClass}" title="${onlineStatusTitle}"></span>
                    </div>
                    <div class="admin-actions">
                        ${actionButtons}
                    </div>
                </div>
                <div class="admin-details">
                    <div class="admin-detail">
                        <i class="fas fa-clock"></i> Dernière connexion: ${formatLastLogin(admin.last_login)}
                    </div>
                    <div class="admin-detail">
                        <i class="fas fa-calendar-alt"></i> Créé le: ${new Date(admin.created_at).toLocaleDateString('fr-FR')}
                    </div>
                </div>
            `;
            
            adminList.appendChild(adminItem);
        });
    }
    
    // Fonction pour mettre à jour l'interface selon l'admin connecté
    function updateAdminUI() {
        if(currentAdmin) {
            // Mettre à jour le nom dans la section profil
            document.getElementById('current-admin-name').textContent = currentAdmin.username;
            
            // Rafraîchir la liste des administrateurs
            refreshAdminList();
            
            // Navigation vers le tableau de bord par défaut
            showSection('dashboard');
        }
    }
    
    // Fonction pour basculer la visibilité du mot de passe
    window.togglePasswordVisibility = function(inputId, toggleElement) {
        const input = document.getElementById(inputId);
        if(input.type === 'password') {
            input.type = 'text';
            toggleElement.innerHTML = '<i class="fas fa-eye-slash"></i>';
        } else {
            input.type = 'password';
            toggleElement.innerHTML = '<i class="fas fa-eye"></i>';
        }
    };
    
    // Fonction pour afficher une notification
    function showNotification(message, type) {
        const notificationCenter = document.getElementById('notification-center');
        
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <div class="notification-header">
                <div class="notification-title">${type === 'success' ? 'Succès' : type === 'danger' ? 'Erreur' : 'Attention'}</div>
                <div class="notification-close"><i class="fas fa-times"></i></div>
            </div>
            <div class="notification-message">${message}</div>
        `;
        
        notificationCenter.appendChild(notification);
        
        // Fermeture automatique après 5 secondes
        setTimeout(() => {
            notification.style.opacity = '0';
            setTimeout(() => {
                notification.remove();
            }, 300);
        }, 5000);
        
        // Fermeture manuelle
        notification.querySelector('.notification-close').addEventListener('click', () => {
            notification.style.opacity = '0';
            setTimeout(() => {
                notification.remove();
            }, 300);
        });
    }
    
    // Intégration avec la navigation existante
    // Ajouter la section admin à la gestion des sections
    const originalShowSection = window.showSection;
    window.showSection = function(sectionId) {
        originalShowSection(sectionId);
        
        // Si la section est la gestion admin, rafraîchir la liste
        if(sectionId === 'admin-management') {
            refreshAdminList();
        }
    };
    
// Vérification si l'utilisateur était déjà connecté
async function checkExistingSession() {
    const adminId = localStorage.getItem('currentAdminId');
    if (adminId) {
        try {
            // Récupérer les informations de l'admin
            const { data, error } = await supabase
                .from('administrators')
                .select('*')
                .eq('id', adminId)
                .maybeSingle();
                
            if (error || !data) {
                console.error('Erreur lors de la récupération de la session:', error);
                localStorage.removeItem('currentAdminId');
                document.getElementById('auth-container').style.display = 'flex';
                await checkFirstLogin();
                return;
            }
            
            // Mettre à jour le statut en ligne
            await supabase
                .from('administrators')
                .update({ online: true })
                .eq('id', adminId);
            
            // Connexion de l'admin
            currentAdmin = data;
            admins = await loadAdmins();
            
            // L'interface d'authentification reste masquée (display: none par défaut)
            updateAdminUI();
        } catch (err) {
            console.error('Erreur lors de la vérification de la session:', err);
            localStorage.removeItem('currentAdminId');
            document.getElementById('auth-container').style.display = 'flex';
            await checkFirstLogin();
        }
    } else {
        // Aucune session, afficher l'écran d'authentification
        document.getElementById('auth-container').style.display = 'flex';
        await checkFirstLogin();
    }
}

    
    // Initialisation
    checkExistingSession();
});



//══════════════════════════════╗
// 🟣 JS PARTIE 3
//══════════════════════════════╝

  // ThemeLangMode.js - Gestion des thèmes, langues et modes (jour/nuit)

document.addEventListener('DOMContentLoaded', function() {
    // Initialisation
    initThemeLangMode();
});

function initThemeLangMode() {
    // Chargement des préférences stockées
    loadPreferences();
    
    // Initialisation des boutons et popups du sidebar
    setupThemeButton();
    setupDarkModeButton();
    setupLanguageButton();
    setupAdvancedButton();
    
    // Initialisation des boutons et popups de l'authentification
    setupAuthSettings();
    
    // Initialisation des événements pour les options des popups
    setupThemeOptions();
    setupLanguageOptions();
    
    // Initialisation du comportement des popups
    setupPopupBehavior();
}

function setupAuthSettings() {
    // Vérifiez si les éléments d'authentification existent
    const authThemeBtn = document.getElementById('auth-ThemeLangMode_themeBtn');
    const authDarkModeBtn = document.getElementById('auth-ThemeLangMode_darkModeBtn');
    const authLangBtn = document.getElementById('auth-ThemeLangMode_langBtn');
    
    if (!authThemeBtn || !authDarkModeBtn || !authLangBtn) return;
    
    // Configuration du bouton de thème pour l'authentification
    const authThemePopup = document.getElementById('auth-ThemeLangMode_themePopup');
    authThemeBtn.addEventListener('click', function() {
        closeAllPopups();
        authThemePopup.classList.toggle('active');
    });
    
    // Configuration du bouton de mode sombre pour l'authentification
    authDarkModeBtn.addEventListener('click', function() {
        toggleDarkMode();
        
        // Mise à jour de l'icône du bouton d'authentification
        const isDarkMode = document.documentElement.getAttribute('data-theme-mode') === 'dark';
        if (isDarkMode) {
            authDarkModeBtn.querySelector('i').className = 'fas fa-sun';
        } else {
            authDarkModeBtn.querySelector('i').className = 'fas fa-moon';
        }
    });
    
    // Configuration du bouton de langue pour l'authentification
    const authLangPopup = document.getElementById('auth-ThemeLangMode_langPopup');
    authLangBtn.addEventListener('click', function() {
        closeAllPopups();
        authLangPopup.classList.toggle('active');
    });
    
    // Configuration du toggle de mode sombre dans le popup d'authentification
    const authDarkModeToggle = document.getElementById('auth-ThemeLangMode_darkModeToggle');
    if (authDarkModeToggle) {
        const isDarkMode = document.documentElement.getAttribute('data-theme-mode') === 'dark';
        authDarkModeToggle.checked = isDarkMode;
        
        authDarkModeToggle.addEventListener('change', function() {
            toggleDarkMode();
            
            // Mise à jour de l'icône du bouton d'authentification
            const isDarkModeNow = document.documentElement.getAttribute('data-theme-mode') === 'dark';
            if (isDarkModeNow) {
                authDarkModeBtn.querySelector('i').className = 'fas fa-sun';
            } else {
                authDarkModeBtn.querySelector('i').className = 'fas fa-moon';
            }
        });
    }
    
    // Mise à jour de la fonction closeAllPopups pour inclure les popups d'authentification
    const originalCloseAllPopups = closeAllPopups;
    closeAllPopups = function() {
        const popups = document.querySelectorAll('.ThemeLangMode_popup, .auth-popup');
        popups.forEach(popup => {
            popup.classList.remove('active');
        });
    };
}



function loadPreferences() {
    // Chargement du thème
    const theme = localStorage.getItem('theme') || 'default';
    document.documentElement.setAttribute('data-theme', theme);
    
    // Chargement du mode sombre/clair
    const darkMode = localStorage.getItem('darkMode') === 'true';
    
    // Mise à jour des boutons principaux
    const darkModeBtn = document.getElementById('ThemeLangMode_darkModeBtn');
    const authDarkModeBtn = document.getElementById('auth-ThemeLangMode_darkModeBtn');
    
    if (darkMode) {
        document.documentElement.setAttribute('data-theme-mode', 'dark');
        if (darkModeBtn) {
            darkModeBtn.querySelector('i').className = 'fas fa-sun';
        }
        if (authDarkModeBtn) {
            authDarkModeBtn.querySelector('i').className = 'fas fa-sun';
        }
    } else {
        document.documentElement.removeAttribute('data-theme-mode');
        if (darkModeBtn) {
            darkModeBtn.querySelector('i').className = 'fas fa-moon';
        }
        if (authDarkModeBtn) {
            authDarkModeBtn.querySelector('i').className = 'fas fa-moon';
        }
    }
    
    // Mise à jour des toggles pour le mode sombre
    const darkModeToggle = document.getElementById('ThemeLangMode_darkModeToggle');
    const authDarkModeToggle = document.getElementById('auth-ThemeLangMode_darkModeToggle');
    if (darkModeToggle) {
        darkModeToggle.checked = darkMode;
    }
    if (authDarkModeToggle) {
        authDarkModeToggle.checked = darkMode;
    }
    
    // Sélection du thème dans l'UI
    const themeItems = document.querySelectorAll('.ThemeLangMode_theme-item');
    themeItems.forEach(item => {
        if (item.getAttribute('data-theme') === theme) {
            item.classList.add('active');
        } else {
            item.classList.remove('active');
        }
    });
    
    // Chargement de la langue
    const language = localStorage.getItem('language') || 'fr';
    document.documentElement.setAttribute('lang', language);
    
    // Sélection de la langue dans l'UI
    const langItems = document.querySelectorAll('.ThemeLangMode_lang-item');
    langItems.forEach(item => {
        if (item.getAttribute('data-lang') === language) {
            item.classList.add('active');
        } else {
            item.classList.remove('active');
        }
    });
}



function setupThemeButton() {
    const themeBtn = document.getElementById('ThemeLangMode_themeBtn');
    const themePopup = document.getElementById('ThemeLangMode_themePopup');
    
    themeBtn.addEventListener('click', function() {
        closeAllPopups();
        themePopup.classList.toggle('active');
    });
}

function setupDarkModeButton() {
    const darkModeBtn = document.getElementById('ThemeLangMode_darkModeBtn');
    const darkModeToggle = document.getElementById('ThemeLangMode_darkModeToggle');
    
    darkModeBtn.addEventListener('click', function() {
        toggleDarkMode();
    });
    
    if (darkModeToggle) {
        darkModeToggle.addEventListener('change', function() {
            toggleDarkMode();
        });
    }
}

function toggleDarkMode() {
    const isDarkMode = document.documentElement.getAttribute('data-theme-mode') === 'dark';
    const darkModeToggle = document.getElementById('ThemeLangMode_darkModeToggle');
    const darkModeBtn = document.getElementById('ThemeLangMode_darkModeBtn');
    
    if (isDarkMode) {
        document.documentElement.removeAttribute('data-theme-mode');
        darkModeBtn.querySelector('i').className = 'fas fa-moon';
        if (darkModeToggle) darkModeToggle.checked = false;
        localStorage.setItem('darkMode', 'false');
    } else {
        document.documentElement.setAttribute('data-theme-mode', 'dark');
        darkModeBtn.querySelector('i').className = 'fas fa-sun';
        if (darkModeToggle) darkModeToggle.checked = true;
        localStorage.setItem('darkMode', 'true');
    }
}


function setupLanguageButton() {
    const langBtn = document.getElementById('ThemeLangMode_langBtn');
    const langPopup = document.getElementById('ThemeLangMode_langPopup');
    
    langBtn.addEventListener('click', function() {
        closeAllPopups();
        langPopup.classList.toggle('active');
    });
}

function setupAdvancedButton() {
    const advancedBtn = document.getElementById('ThemeLangMode_advancedBtn');
    
    advancedBtn.addEventListener('click', function() {
        closeAllPopups();
        // Ici vous pourriez ajouter l'ouverture d'une modal ou popup pour les paramètres avancés
        showNotification('Paramètres avancés', 'Les paramètres avancés seront disponibles prochainement.', 'info');
    });
}

function setupThemeOptions() {
    const themeItems = document.querySelectorAll('.ThemeLangMode_theme-item');
    
    themeItems.forEach(item => {
        item.addEventListener('click', function() {
            const theme = this.getAttribute('data-theme');
            
            // Mise à jour de l'UI
            themeItems.forEach(el => el.classList.remove('active'));
            this.classList.add('active');
            
            // Application du thème
            document.documentElement.setAttribute('data-theme', theme);
            localStorage.setItem('theme', theme);
            
            // Fermeture du popup
            setTimeout(() => {
                closeAllPopups();
            }, 300);
        });
    });
}

function setupLanguageOptions() {
    const langItems = document.querySelectorAll('.ThemeLangMode_lang-item');
    
    langItems.forEach(item => {
        item.addEventListener('click', function() {
            const lang = this.getAttribute('data-lang');
            
            // Mise à jour de l'UI
            langItems.forEach(el => el.classList.remove('active'));
            this.classList.add('active');
            
            // Application de la langue (simulation pour l'instant)
            document.documentElement.setAttribute('lang', lang);
            localStorage.setItem('language', lang);
            
            // Fermeture du popup
            setTimeout(() => {
                closeAllPopups();
            }, 300);
            
            // Note: Pour une vraie implémentation multilingue, il faudrait
            // charger les fichiers de traduction ici et mettre à jour le contenu
        });
    });
}

function setupPopupBehavior() {
    // Fermeture des popups lorsqu'on clique sur le bouton de fermeture
    const closeButtons = document.querySelectorAll('.ThemeLangMode_popup-close');
    closeButtons.forEach(button => {
        button.addEventListener('click', function() {
            closeAllPopups();
        });
    });
    
    // Fermeture des popups lorsqu'on clique à l'extérieur
    document.addEventListener('click', function(event) {
        const popups = document.querySelectorAll('.ThemeLangMode_popup, .auth-popup');
        const settingBtns = document.querySelectorAll('.ThemeLangMode_settingBtn');
        
        let isClickInsidePopup = false;
        let isClickOnButton = false;
        
        popups.forEach(popup => {
            if (popup.contains(event.target)) {
                isClickInsidePopup = true;
            }
        });
        
        settingBtns.forEach(btn => {
            if (btn.contains(event.target)) {
                isClickOnButton = true;
            }
        });
        
        if (!isClickInsidePopup && !isClickOnButton) {
            closeAllPopups();
        }
    });
    
    // Synchro entre les popups d'authentification et les popups normaux
    const themeItems = document.querySelectorAll('.ThemeLangMode_theme-item');
    themeItems.forEach(item => {
        item.addEventListener('click', function() {
            const theme = this.getAttribute('data-theme');
            
            // Mise à jour de l'UI dans tous les popups de thème
            document.querySelectorAll('.ThemeLangMode_theme-item').forEach(el => {
                if (el.getAttribute('data-theme') === theme) {
                    el.classList.add('active');
                } else {
                    el.classList.remove('active');
                }
            });
        });
    });
    
    const langItems = document.querySelectorAll('.ThemeLangMode_lang-item');
    langItems.forEach(item => {
        item.addEventListener('click', function() {
            const lang = this.getAttribute('data-lang');
            
            // Mise à jour de l'UI dans tous les popups de langue
            document.querySelectorAll('.ThemeLangMode_lang-item').forEach(el => {
                if (el.getAttribute('data-lang') === lang) {
                    el.classList.add('active');
                } else {
                    el.classList.remove('active');
                }
            });
        });
    });
}


function closeAllPopups() {
    const popups = document.querySelectorAll('.ThemeLangMode_popup');
    popups.forEach(popup => {
        popup.classList.remove('active');
    });
}



/*══════════════════════════════╗
  🟠 JS PARTIE 4
  ═════════════════════════════╝*/
// Configuration des devises et taux de change
let currencySettings = {
    displayMode: 'both',  // 'usd', 'cdf', ou 'both'
    exchangeRate: 2500,   // Taux par défaut (1 USD = x CDF)
    lastUpdated: null,
    customRate: false     // Si un taux personnalisé est utilisé
};

// Charger les paramètres enregistrés
function loadCurrencySettings() {
    const savedSettings = localStorage.getItem('totalInventoryCurrencySettings');
    if (savedSettings) {
        currencySettings = JSON.parse(savedSettings);
    }
    
    // Mettre à jour l'interface
    updateCurrencyInterface();
}

// Sauvegarder les paramètres
function saveCurrencySettings() {
    localStorage.setItem('totalInventoryCurrencySettings', JSON.stringify(currencySettings));
}

// Mettre à jour l'interface avec les paramètres actuels
function updateCurrencyInterface() {
    // Afficher le taux de change actuel
    document.getElementById('rate-display-usd-to-cdf').textContent = currencySettings.exchangeRate.toFixed(2);
    document.getElementById('rate-display-cdf-to-usd').textContent = (1 / currencySettings.exchangeRate).toFixed(6);
    
    // Mettre à jour l'heure de la dernière mise à jour
    if (currencySettings.lastUpdated) {
        const lastUpdate = new Date(currencySettings.lastUpdated);
        document.getElementById('rate-update-time').textContent = 'Mise à jour: ' + lastUpdate.toLocaleString();
    }
    
    // Mettre à jour le mode d'affichage sélectionné
    document.querySelector(`input[name="currency-display"][value="${currencySettings.displayMode}"]`).checked = true;
    
    // Mettre à jour les champs du formulaire
    if (currencySettings.customRate) {
        document.getElementById('custom-rate').value = currencySettings.exchangeRate;
    } else {
        document.getElementById('custom-rate').value = '';
    }
}

// Fonction pour obtenir le taux de change en ligne
async function fetchExchangeRate() {
    try {
        document.getElementById('refresh-rate').disabled = true;
        document.getElementById('refresh-rate').innerHTML = '<span class="loading-spinner"></span> Chargement...';
        
        // Utiliser l'API ExchangeRate-API (open source version, pas de clé nécessaire)
        const response = await fetch('https://open.er-api.com/v6/latest/USD');
        const data = await response.json();
        
        if (data && data.rates && data.rates.CDF) {
            // Mettre à jour le taux
            currencySettings.exchangeRate = data.rates.CDF;
            currencySettings.lastUpdated = new Date().toISOString();
            currencySettings.customRate = false;
            
            // Sauvegarder et mettre à jour l'interface
            saveCurrencySettings();
            updateCurrencyInterface();
            
            // Mettre à jour l'affichage des prix dans l'inventaire
            updateAllPriceDisplays();
            
            showNotification('Taux de change', 'Le taux de change a été mis à jour avec succès.', 'success');
        } else {
            throw new Error('Données incomplètes');
        }
    } catch (error) {
        console.error('Erreur lors de la récupération du taux de change:', error);
        showNotification('Erreur', 'Impossible de récupérer le taux de change en ligne. Utilisez un taux personnalisé ou réessayez plus tard.', 'error');
    } finally {
        document.getElementById('refresh-rate').disabled = false;
        document.getElementById('refresh-rate').innerHTML = '<i class="fas fa-sync-alt me-1"></i> Rafraîchir';
    }
}

// Fonction pour appliquer un taux personnalisé
function applyCustomRate() {
    const customRate = parseFloat(document.getElementById('custom-rate').value);
    
    if (customRate && customRate > 0) {
        currencySettings.exchangeRate = customRate;
        currencySettings.lastUpdated = new Date().toISOString();
        currencySettings.customRate = true;
        
        // Sauvegarder et mettre à jour l'interface
        saveCurrencySettings();
        updateCurrencyInterface();
        
        // Mettre à jour l'affichage des prix dans l'inventaire
        updateAllPriceDisplays();
        
        showNotification('Taux personnalisé', 'Le taux de change personnalisé a été appliqué.', 'success');
    } else {
        showNotification('Erreur', 'Veuillez entrer un taux de change valide.', 'error');
    }
}

// Fonctions de conversion de devises
function convertUsdToCdf(amountUsd) {
    return amountUsd * currencySettings.exchangeRate;
}

function convertCdfToUsd(amountCdf) {
    return amountCdf / currencySettings.exchangeRate;
}

// Formatter un prix selon le mode d'affichage
function formatPrice(amount, currency) {
    if (!amount && amount !== 0) return '--';
    
    const formatted = parseFloat(amount).toFixed(2);
    
    if (currency === 'usd') {
        return `${formatted} $`;
    } else if (currency === 'cdf') {
        return `${formatted} FC`;
    }
}

// Formatter un prix pour l'affichage selon le mode choisi
function formatPriceForDisplay(amount, originalCurrency) {
    if (!amount && amount !== 0) return '--';
    
    const amountUsd = originalCurrency === 'usd' ? amount : convertCdfToUsd(amount);
    const amountCdf = originalCurrency === 'cdf' ? amount : convertUsdToCdf(amount);
    
    // Format d'affichage selon le mode choisi
    switch (currencySettings.displayMode) {
        case 'usd':
            return formatPrice(amountUsd, 'usd');
        case 'cdf':
            return formatPrice(amountCdf, 'cdf');
        case 'both':
            return `
                <span class="price-display">
                    <span>${formatPrice(amountUsd, 'usd')}</span>
                    <span class="price-secondary">(${formatPrice(amountCdf, 'cdf')})</span>
                </span>
            `;
        default:
            return formatPrice(amount, originalCurrency);
    }
}

// Mettre à jour l'affichage des prix pour tous les éléments de l'interface
function updateAllPriceDisplays() {
    // Mettre à jour le tableau de bord
    updateDashboardStats();
    
    // Mettre à jour la table d'inventaire
    loadInventoryTable();
    
    // Mettre à jour les produits récents
    loadRecentProducts();
    
    // Mettre à jour la table d'impression
    if (document.getElementById('print-products-table').style.display !== 'none') {
        loadPrintTable();
    }
}

// Initialiser les événements pour la gestion des devises
function initCurrencyEvents() {
    // Rafraîchir le taux de change
    document.getElementById('refresh-rate').addEventListener('click', fetchExchangeRate);
    
    // Appliquer un taux personnalisé
    document.getElementById('apply-custom-rate').addEventListener('click', applyCustomRate);
    
    // Convertisseur de devises interactif
    document.getElementById('convert-amount-usd').addEventListener('input', function() {
        const amountUsd = parseFloat(this.value) || 0;
        document.getElementById('convert-amount-cdf').value = convertUsdToCdf(amountUsd).toFixed(2);
    });
    
    document.getElementById('convert-amount-cdf').addEventListener('input', function() {
        const amountCdf = parseFloat(this.value) || 0;
        document.getElementById('convert-amount-usd').value = convertCdfToUsd(amountCdf).toFixed(2);
    });
    
    // Enregistrer les préférences d'affichage
    document.getElementById('currency-settings-form').addEventListener('submit', function(e) {
        e.preventDefault();
        
        // Récupérer le mode d'affichage sélectionné
        const displayMode = document.querySelector('input[name="currency-display"]:checked').value;
        currencySettings.displayMode = displayMode;
        
        // Sauvegarder les paramètres
        saveCurrencySettings();
        
        // Mettre à jour l'affichage des prix
        updateAllPriceDisplays();
        
        showNotification('Préférences', 'Les préférences d\'affichage ont été enregistrées.', 'success');
    });
}


//══════════════════════════════╗
// 🔴 JS PARTIE 5
//══════════════════════════════╝

  // Configuration de l'Assistant IA
let aiConversation = [];
let aiUserPreferences = JSON.parse(localStorage.getItem('totalAiPreferences')) || {
    reportTime: '18:00',
    reportFrequency: 'daily',
    language: 'fr',
    lastReportDate: null
};

// Fonctions pour l'Assistant IA
function initAiAssistant() {
    // Réinitialiser la conversation
    aiConversation = [];
    
    // Afficher le message d'accueil
    addAiMessage({
        type: 'ai',
        content: `<p>Bonjour ! Je suis TotalAssist, votre assistant de gestion d'inventaire.</p>
                 <p>Je vais vous aider à gérer votre stock de façon simple et efficace.</p>
                 <div class="ai-inventory-summary">
                    <div class="ai-stat">
                        <div class="ai-stat-icon inventory">
                            <i class="fas fa-box-open"></i>
                        </div>
                        <div class="ai-stat-info">
                            <h4>${products.reduce((total, product) => total + product.quantity, 0)}</h4>
                            <p>Produits en stock</p>
                        </div>
                    </div>
                    <div class="ai-stat">
                        <div class="ai-stat-icon low">
                            <i class="fas fa-exclamation-triangle"></i>
                        </div>
                        <div class="ai-stat-info">
                            <h4>${products.filter(product => product.quantity > 0 && product.quantity <= product.minStock).length}</h4>
                            <p>Produits en stock faible</p>
                        </div>
                    </div>
                    <div class="ai-stat">
                        <div class="ai-stat-icon out">
                            <i class="fas fa-times-circle"></i>
                        </div>
                        <div class="ai-stat-info">
                            <h4>${products.filter(product => product.quantity <= 0).length}</h4>
                            <p>Produits en rupture</p>
                        </div>
                    </div>
                 </div>
                 <p>Comment puis-je vous aider aujourd'hui ?</p>`
    });
    
    // Afficher les options principales
    showMainOptions();
}

function addAiMessage(message) {
    // Enregistrer le message dans la conversation
    aiConversation.push(message);
    
    // Créer l'élément du message
    const messageEl = document.createElement('div');
    messageEl.className = `ai-message ${message.type}`;
    
    // Ajouter le contenu du message
    messageEl.innerHTML = `
        ${message.content}
        <div class="ai-message-time">${new Date().toLocaleTimeString()}</div>
    `;
    
    // Ajouter au conteneur de messages
    document.getElementById('ai-messages').appendChild(messageEl);
    
    // Scroll vers le bas
    const messagesContainer = document.getElementById('ai-messages');
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

function showTypingIndicator() {
    const typingEl = document.createElement('div');
    typingEl.className = 'ai-typing';
    typingEl.id = 'ai-typing-indicator';
    typingEl.innerHTML = '<span></span><span></span><span></span>';
    
    document.getElementById('ai-messages').appendChild(typingEl);
    
    // Scroll vers le bas
    const messagesContainer = document.getElementById('ai-messages');
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

function removeTypingIndicator() {
    const typingEl = document.getElementById('ai-typing-indicator');
    if (typingEl) {
        typingEl.remove();
    }
}

function showMainOptions() {
    // Définir les options principales
    const options = [
        { icon: 'fas fa-chart-line', text: 'Voir mon inventaire', action: 'showInventorySummary' },
        { icon: 'fas fa-exclamation-triangle', text: 'Produits en stock faible', action: 'showLowStockProducts' },
        { icon: 'fas fa-plus-circle', text: 'Ajouter un produit', action: 'navigateToAddProduct' },
        { icon: 'fas fa-search', text: 'Rechercher un produit', action: 'showSearchProduct' },
        { icon: 'fas fa-file-alt', text: 'Rapport journalier', action: 'generateDailyReport' },
        { icon: 'fas fa-cog', text: 'Configurer les rapports', action: 'configureReports' }
    ];
    
    renderOptions(options);
}

function renderOptions(options) {
    const optionsContainer = document.getElementById('ai-options');
    optionsContainer.innerHTML = '';
    
    // Vérifier si le conteneur parent existe, sinon le créer
    let optionsParentContainer = document.querySelector('.ai-options-container');
    if (!optionsParentContainer) {
        optionsParentContainer = document.createElement('div');
        optionsParentContainer.className = 'ai-options-container';
        optionsContainer.parentNode.replaceChild(optionsParentContainer, optionsContainer);
        optionsParentContainer.appendChild(optionsContainer);
        
        // Ajouter le bouton de toggle pour changer l'orientation
        const toggleButton = document.createElement('div');
        toggleButton.className = 'ai-options-layout-toggle';
        toggleButton.innerHTML = '<i class="fas fa-list"></i>';
        toggleButton.addEventListener('click', toggleOptionsLayout);
        optionsParentContainer.appendChild(toggleButton);
    }
    
    options.forEach(option => {
        const optionEl = document.createElement('div');
        optionEl.className = 'ai-option';
        optionEl.innerHTML = `<i class="${option.icon}"></i> ${option.text}`;
        
        optionEl.addEventListener('click', () => {
            // Ajouter la sélection de l'utilisateur comme message
            addAiMessage({
                type: 'user',
                content: `<p>${option.text}</p>`
            });
            
            // Effacer les options
            optionsContainer.innerHTML = '';
            
            // Montrer l'indicateur de frappe
            showTypingIndicator();
            
            // Simuler un délai pour une expérience plus naturelle
            setTimeout(() => {
                removeTypingIndicator();
                
                // Exécuter l'action associée
                window[option.action]();
            }, 1000);
        });
        
        optionsContainer.appendChild(optionEl);
    });
    
    // Faire défiler automatiquement vers le début des options
    optionsContainer.scrollLeft = 0;
}

// Fonction pour basculer entre la disposition horizontale et verticale des options
function toggleOptionsLayout() {
    const optionsContainer = document.getElementById('ai-options');
    const toggleButton = document.querySelector('.ai-options-layout-toggle');
    
    if (optionsContainer.classList.contains('vertical')) {
        // Passer en mode horizontal
        optionsContainer.classList.remove('vertical');
        toggleButton.innerHTML = '<i class="fas fa-list"></i>';
    } else {
        // Passer en mode vertical
        optionsContainer.classList.add('vertical');
        toggleButton.innerHTML = '<i class="fas fa-grip-lines"></i>';
    }
    
    // Ajuster le scroll pour s'assurer que les options sont visibles
    if (optionsContainer.classList.contains('vertical')) {
        optionsContainer.scrollTop = 0;
    } else {
        optionsContainer.scrollLeft = 0;
    }
}


function showInventorySummary() {
    // Obtenir les 5 derniers produits ajoutés
    const recentProducts = [...products]
        .sort((a, b) => new Date(b.dateAdded) - new Date(a.dateAdded))
        .slice(0, 5);
    
    // Calcul de la valeur totale du stock
    let totalValue = 0;
    products.forEach(product => {
        let priceUsd;
        if (product.priceCurrency === 'cdf') {
            priceUsd = convertCdfToUsd(product.price);
        } else {
            priceUsd = product.price;
        }
        totalValue += priceUsd * product.quantity;
    });
    
    // Créer le contenu du message
    let messageContent = `
        <p>Voici un résumé de votre inventaire actuel :</p>
        <div class="ai-inventory-summary">
            <div class="ai-stat">
                <div class="ai-stat-icon inventory">
                    <i class="fas fa-box-open"></i>
                </div>
                <div class="ai-stat-info">
                    <h4>${products.reduce((total, product) => total + product.quantity, 0)}</h4>
                    <p>Produits en stock</p>
                </div>
            </div>
            <div class="ai-stat">
                <div class="ai-stat-icon inventory">
                    <i class="fas fa-dollar-sign"></i>
                </div>
                <div class="ai-stat-info">
                    <h4>${formatPriceForDisplay(totalValue, 'usd')}</h4>
                    <p>Valeur totale</p>
                </div>
            </div>
        </div>
    `;
    
    // Ajouter les produits récents
    if (recentProducts.length > 0) {
        messageContent += `<p>Voici vos produits ajoutés récemment :</p><div class="ai-product-list">`;
        
        recentProducts.forEach(product => {
            const formattedPrice = formatPriceForDisplay(product.price, product.priceCurrency || 'usd');
            const stockStatus = getStockStatus(product.quantity, product.minStock);
            let statusIcon = '';
            
            if (stockStatus === 'in-stock') {
                statusIcon = '<i class="fas fa-check-circle" style="color: var(--success);"></i>';
            } else if (stockStatus === 'low-stock') {
                statusIcon = '<i class="fas fa-exclamation-triangle" style="color: var(--warning);"></i>';
            } else {
                statusIcon = '<i class="fas fa-times-circle" style="color: var(--danger);"></i>';
            }
            
            messageContent += `
                <div class="ai-product-item">
                    <div class="ai-product-info">
                        <div class="ai-product-name">${product.name} ${statusIcon}</div>
                        <div class="ai-product-details">${formattedPrice} | Quantité: ${product.quantity}</div>
                    </div>
                    <div class="ai-product-actions">
                        <div class="ai-product-action" onclick="openProductModalFromAi('${product.id}')">
                            <i class="fas fa-edit"></i>
                        </div>
                        <div class="ai-product-action" onclick="openSellModalFromAi('${product.id}')">
                            <i class="fas fa-shopping-cart"></i>
                        </div>
                    </div>
                </div>
            `;
        });
        
        messageContent += `</div>`;
    } else {
        messageContent += `<p>Vous n'avez pas encore de produits dans votre inventaire.</p>`;
    }
    
    messageContent += `<p>Que souhaitez-vous faire maintenant ?</p>`;
    
    // Ajouter le message
    addAiMessage({
        type: 'ai',
        content: messageContent
    });
    
    // Montrer les options après l'inventaire
    const options = [
        { icon: 'fas fa-plus-circle', text: 'Ajouter un produit', action: 'navigateToAddProduct' },
        { icon: 'fas fa-exclamation-triangle', text: 'Voir les produits en stock faible', action: 'showLowStockProducts' },
        { icon: 'fas fa-list', text: 'Voir tout l\'inventaire', action: 'navigateToInventory' },
        { icon: 'fas fa-home', text: 'Menu principal', action: 'showMainOptions' }
    ];
    
    renderOptions(options);
    
    // Vérifier la satisfaction
    setTimeout(() => {
        checkSatisfaction("Êtes-vous satisfait de ce résumé d'inventaire ?");
    }, 1000);
}

function showLowStockProducts() {
    // Obtenir les produits en stock faible
    const lowStockProducts = products.filter(
        product => product.quantity > 0 && product.quantity <= product.minStock
    );
    
    // Obtenir les produits en rupture
    const outOfStockProducts = products.filter(
        product => product.quantity <= 0
    );
    
    // Créer le contenu du message
    let messageContent = `
        <p>Voici les produits qui nécessitent votre attention :</p>
    `;
    
    // Ajouter les produits en stock faible
    if (lowStockProducts.length > 0) {
        messageContent += `<p><strong>Produits en stock faible :</strong></p><div class="ai-product-list">`;
        
        lowStockProducts.forEach(product => {
            const formattedPrice = formatPriceForDisplay(product.price, product.priceCurrency || 'usd');
            
            messageContent += `
                <div class="ai-product-item">
                    <div class="ai-product-info">
                        <div class="ai-product-name">${product.name} <i class="fas fa-exclamation-triangle" style="color: var(--warning);"></i></div>
                        <div class="ai-product-details">${formattedPrice} | Quantité: ${product.quantity}/${product.minStock}</div>
                    </div>
                    <div class="ai-product-actions">
                        <div class="ai-product-action" onclick="openProductModalFromAi('${product.id}')">
                            <i class="fas fa-edit"></i>
                        </div>
                        <div class="ai-product-action" onclick="restockProductFromAi('${product.id}')">
                            <i class="fas fa-plus"></i>
                        </div>
                    </div>
                </div>
            `;
        });
        
        messageContent += `</div>`;
    } else {
        messageContent += `<p>Bonne nouvelle ! Vous n'avez pas de produits en stock faible.</p>`;
    }
    
    // Ajouter les produits en rupture
    if (outOfStockProducts.length > 0) {
        messageContent += `<p><strong>Produits en rupture de stock :</strong></p><div class="ai-product-list">`;
        
        outOfStockProducts.forEach(product => {
            const formattedPrice = formatPriceForDisplay(product.price, product.priceCurrency || 'usd');
            
            messageContent += `
                <div class="ai-product-item">
                    <div class="ai-product-info">
                        <div class="ai-product-name">${product.name} <i class="fas fa-times-circle" style="color: var(--danger);"></i></div>
                        <div class="ai-product-details">${formattedPrice} | Rupture de stock</div>
                    </div>
                    <div class="ai-product-actions">
                        <div class="ai-product-action" onclick="openProductModalFromAi('${product.id}')">
                            <i class="fas fa-edit"></i>
                        </div>
                        <div class="ai-product-action" onclick="restockProductFromAi('${product.id}')">
                            <i class="fas fa-plus"></i>
                        </div>
                    </div>
                </div>
            `;
        });
        
        messageContent += `</div>`;
    } else {
        messageContent += `<p>Bonne nouvelle ! Vous n'avez pas de produits en rupture de stock.</p>`;
    }
    
    // Si aucun problème
    if (lowStockProducts.length === 0 && outOfStockProducts.length === 0) {
        messageContent += `<p>Votre inventaire est en excellent état ! Tous vos produits ont des niveaux de stock satisfaisants.</p>`;
    } else {
        messageContent += `<p>Je vous recommande de réapprovisionner ces produits dès que possible pour éviter les ruptures de stock.</p>`;
    }
    
    // Ajouter le message
    addAiMessage({
        type: 'ai',
        content: messageContent
    });
    
    // Montrer les options après l'alerte
    const options = [
        { icon: 'fas fa-plus-circle', text: 'Réapprovisionner', action: 'navigateToAddProduct' },
        { icon: 'fas fa-chart-line', text: 'Voir tout l\'inventaire', action: 'navigateToInventory' },
        { icon: 'fas fa-file-alt', text: 'Générer un rapport', action: 'generateDailyReport' },
        { icon: 'fas fa-home', text: 'Menu principal', action: 'showMainOptions' }
    ];
    
    renderOptions(options);
}

function navigateToAddProduct() {
    addAiMessage({
        type: 'ai',
        content: `
            <p>Je vous dirige vers la section d'ajout de produit.</p>
            <p>Vous pourrez y ajouter un nouveau produit à votre inventaire ou réapprovisionner un produit existant.</p>
            <p>N'hésitez pas à revenir me voir si vous avez besoin d'aide ! 😊</p>
        `
    });
    
    setTimeout(() => {
        showSection('add-product');
    }, 1500);
}

function navigateToInventory() {
    addAiMessage({
        type: 'ai',
        content: `
            <p>Je vous dirige vers la section inventaire.</p>
            <p>Vous y trouverez la liste complète de tous vos produits avec leurs détails.</p>
            <p>N'hésitez pas à revenir me voir si vous avez besoin d'aide ! 😊</p>
        `
    });
    
    setTimeout(() => {
        showSection('inventory');
    }, 1500);
}

function showSearchProduct() {
    addAiMessage({
        type: 'ai',
        content: `
            <p>Que recherchez-vous dans votre inventaire ?</p>
            <p>Choisissez une catégorie ou sélectionnez un produit populaire :</p>
        `
    });
    
    // Obtenir les catégories uniques
    const categories = [...new Set(products.map(p => p.category))].filter(Boolean);
    
    // Obtenir les produits les plus vendus (ou simplement quelques produits)
    const popularProducts = [...products]
        .sort(() => 0.5 - Math.random())
        .slice(0, 5);
    
    // Créer les options de catégories
    const categoryOptions = categories.map(category => ({
        icon: 'fas fa-tag',
        text: `Catégorie: ${category}`,
        action: `searchByCategory`,
        data: category
    }));
    
    // Créer les options de produits
    const productOptions = popularProducts.map(product => ({
        icon: 'fas fa-box',
        text: product.name,
        action: `showProductDetails`,
        data: product.id
    }));
    
    // Combiner les options
    const allOptions = [
        ...categoryOptions,
        ...productOptions,
        { icon: 'fas fa-search', text: 'Recherche avancée', action: 'navigateToInventory' },
        { icon: 'fas fa-home', text: 'Menu principal', action: 'showMainOptions' }
    ];
    
    // Vérifier si le conteneur parent existe, sinon le créer
    const optionsContainer = document.getElementById('ai-options');
    optionsContainer.innerHTML = '';
    
    let optionsParentContainer = document.querySelector('.ai-options-container');
    if (!optionsParentContainer) {
        optionsParentContainer = document.createElement('div');
        optionsParentContainer.className = 'ai-options-container';
        optionsContainer.parentNode.replaceChild(optionsParentContainer, optionsContainer);
        optionsParentContainer.appendChild(optionsContainer);
        
        // Ajouter le bouton de toggle pour changer l'orientation
        const toggleButton = document.createElement('div');
        toggleButton.className = 'ai-options-layout-toggle';
        toggleButton.innerHTML = '<i class="fas fa-list"></i>';
        toggleButton.addEventListener('click', toggleOptionsLayout);
        optionsParentContainer.appendChild(toggleButton);
    }
    
    allOptions.forEach(option => {
        const optionEl = document.createElement('div');
        optionEl.className = 'ai-option';
        optionEl.innerHTML = `<i class="${option.icon}"></i> ${option.text}`;
        
        optionEl.addEventListener('click', () => {
            // Ajouter la sélection de l'utilisateur comme message
            addAiMessage({
                type: 'user',
                content: `<p>${option.text}</p>`
            });
            
            // Effacer les options
            optionsContainer.innerHTML = '';
            
            // Montrer l'indicateur de frappe
            showTypingIndicator();
            
            // Simuler un délai pour une expérience plus naturelle
            setTimeout(() => {
                removeTypingIndicator();
                
                // Exécuter l'action associée avec les données si nécessaire
                if (option.action === 'searchByCategory') {
                    searchByCategory(option.data);
                } else if (option.action === 'showProductDetails') {
                    showProductDetails(option.data);
                } else {
                    window[option.action]();
                }
            }, 1000);
        });
        
        optionsContainer.appendChild(optionEl);
    });
    
    // Faire défiler automatiquement vers le début des options
    optionsContainer.scrollLeft = 0;
}


function searchByCategory(category) {
    // Filtrer les produits par catégorie
    const filteredProducts = products.filter(p => p.category === category);
    
    if (filteredProducts.length === 0) {
        addAiMessage({
            type: 'ai',
            content: `<p>Je n'ai trouvé aucun produit dans la catégorie "${category}".</p>`
        });
        
        showMainOptions();
        return;
    }
    
    let messageContent = `
        <p>Voici les produits de la catégorie "${category}" :</p>
        <div class="ai-product-list">
    `;
    
    filteredProducts.forEach(product => {
        const formattedPrice = formatPriceForDisplay(product.price, product.priceCurrency || 'usd');
        const stockStatus = getStockStatus(product.quantity, product.minStock);
        let statusIcon = '';
        
        if (stockStatus === 'in-stock') {
            statusIcon = '<i class="fas fa-check-circle" style="color: var(--success);"></i>';
        } else if (stockStatus === 'low-stock') {
            statusIcon = '<i class="fas fa-exclamation-triangle" style="color: var(--warning);"></i>';
        } else {
            statusIcon = '<i class="fas fa-times-circle" style="color: var(--danger);"></i>';
        }
        
        messageContent += `
            <div class="ai-product-item">
                <div class="ai-product-info">
                    <div class="ai-product-name">${product.name} ${statusIcon}</div>
                    <div class="ai-product-details">${formattedPrice} | Quantité: ${product.quantity}</div>
                </div>
                <div class="ai-product-actions">
                    <div class="ai-product-action" onclick="showProductDetails('${product.id}')">
                        <i class="fas fa-info-circle"></i>
                    </div>
                    <div class="ai-product-action" onclick="openProductModalFromAi('${product.id}')">
                        <i class="fas fa-edit"></i>
                    </div>
                </div>
            </div>
        `;
    });
    
    messageContent += `</div>`;
    
    addAiMessage({
        type: 'ai',
        content: messageContent
    });
    
    // Options après la recherche
    const options = [
        { icon: 'fas fa-search', text: 'Autre recherche', action: 'showSearchProduct' },
        { icon: 'fas fa-list', text: 'Voir tout l\'inventaire', action: 'navigateToInventory' },
        { icon: 'fas fa-home', text: 'Menu principal', action: 'showMainOptions' }
    ];
    
    renderOptions(options);
}

function showProductDetails(productId) {
    const product = products.find(p => p.id === productId);
    
    if (!product) {
        addAiMessage({
            type: 'ai',
            content: `<p>Désolé, je ne trouve pas ce produit dans votre inventaire.</p>`
        });
        
        showMainOptions();
        return;
    }
    
    const formattedPrice = formatPriceForDisplay(product.price, product.priceCurrency || 'usd');
    const stockStatus = getStockStatus(product.quantity, product.minStock);
    let statusBadge = '';
    
    if (stockStatus === 'in-stock') {
        statusBadge = '<span class="badge badge-stock badge-in-stock">En stock</span>';
    } else if (stockStatus === 'low-stock') {
        statusBadge = '<span class="badge badge-stock badge-low-stock">Stock faible</span>';
    } else {
        statusBadge = '<span class="badge badge-stock badge-out-of-stock">Rupture</span>';
    }
    
    // Obtenir les informations sur l'unité de mesure
    const unitInfo = getUnitInfo(product.unit || 'piece');
    
    let messageContent = `
        <div style="text-align: center; margin-bottom: 15px;">
            <h3 style="margin: 0 0 5px 0; font-size: 1.2rem;">${product.name}</h3>
            ${statusBadge}
        </div>
        
        <div class="ai-product-details-table">
            <table class="ai-table">
                <tr>
                    <th>Code</th>
                    <td>${product.code}</td>
                </tr>
                <tr>
                    <th>Prix</th>
                    <td>${formattedPrice}</td>
                </tr>
                <tr>
                    <th>Quantité</th>
                    <td>${product.quantity} <span class="unit-badge"><i class="${unitInfo.icon}"></i>${unitInfo.name}</span></td>
                </tr>
                <tr>
                    <th>Emplacement</th>
                    <td>${product.location || 'Non spécifié'}</td>
                </tr>
                <tr>
                    <th>Catégorie</th>
                    <td>${product.category || 'Non spécifiée'}</td>
                </tr>
                <tr>
                    <th>Stock min</th>
                    <td>${product.minStock}</td>
                </tr>
                <tr>
                    <th>Fournisseur</th>
                    <td>${product.supplier || 'Non spécifié'}</td>
                </tr>
                <tr>
                    <th>Description</th>
                    <td>${product.description || 'Aucune description'}</td>
                </tr>
            </table>
        </div>
        
        <p style="margin-top: 15px; font-size: 0.95rem;">Que souhaitez-vous faire avec ce produit ?</p>
    `;
    
    addAiMessage({
        type: 'ai',
        content: messageContent
    });
    
    // Options pour ce produit
    const options = [
        { icon: 'fas fa-edit', text: 'Modifier', action: 'openProductModalFromAi', data: productId },
        { icon: 'fas fa-shopping-cart', text: 'Vendre', action: 'openSellModalFromAi', data: productId },
        { icon: 'fas fa-plus', text: 'Réapprovisionner', action: 'restockProductFromAi', data: productId },
        { icon: 'fas fa-print', text: 'Imprimer code', action: 'printProductCodesFromAi', data: productId },
        { icon: 'fas fa-search', text: 'Autre recherche', action: 'showSearchProduct' },
        { icon: 'fas fa-home', text: 'Menu principal', action: 'showMainOptions' }
    ];
    
    // Rendre les options avec gestion des données personnalisées
    const optionsContainer = document.getElementById('ai-options');
    optionsContainer.innerHTML = '';
    
    // Vérifier si le conteneur parent existe, sinon le créer
    let optionsParentContainer = document.querySelector('.ai-options-container');
    if (!optionsParentContainer) {
        optionsParentContainer = document.createElement('div');
        optionsParentContainer.className = 'ai-options-container';
        optionsContainer.parentNode.replaceChild(optionsParentContainer, optionsContainer);
        optionsParentContainer.appendChild(optionsContainer);
        
        // Ajouter le bouton de toggle pour changer l'orientation
        const toggleButton = document.createElement('div');
        toggleButton.className = 'ai-options-layout-toggle';
        toggleButton.innerHTML = '<i class="fas fa-list"></i>';
        toggleButton.addEventListener('click', toggleOptionsLayout);
        optionsParentContainer.appendChild(toggleButton);
    }
    
    options.forEach(option => {
        const optionEl = document.createElement('div');
        optionEl.className = 'ai-option';
        optionEl.innerHTML = `<i class="${option.icon}"></i> ${option.text}`;
        
        optionEl.addEventListener('click', () => {
            // Ajouter la sélection de l'utilisateur comme message
            addAiMessage({
                type: 'user',
                content: `<p>${option.text}</p>`
            });
            
            // Effacer les options
            optionsContainer.innerHTML = '';
            
            // Montrer l'indicateur de frappe
            showTypingIndicator();
            
            // Simuler un délai pour une expérience plus naturelle
            setTimeout(() => {
                removeTypingIndicator();
                
                // Exécuter l'action associée avec les données si nécessaire
                if (option.action === 'openProductModalFromAi') {
                    openProductModalFromAi(option.data);
                } else if (option.action === 'openSellModalFromAi') {
                    openSellModalFromAi(option.data);
                } else if (option.action === 'restockProductFromAi') {
                    restockProductFromAi(option.data);
                } else if (option.action === 'printProductCodesFromAi') {
                    printProductCodesFromAi(option.data);
                } else {
                    window[option.action]();
                }
            }, 1000);
        });
        
        optionsContainer.appendChild(optionEl);
    });
    
    // Faire défiler automatiquement vers le début des options
    optionsContainer.scrollLeft = 0;
}


function generateDailyReport() {
    // Calculer les statistiques
    const totalProducts = products.reduce((total, product) => total + product.quantity, 0);
    const lowStockCount = products.filter(p => p.quantity > 0 && p.quantity <= p.minStock).length;
    const outOfStockCount = products.filter(p => p.quantity <= 0).length;
    
    // Calculer la valeur totale du stock
    let totalValue = 0;
    products.forEach(product => {
        let priceUsd;
        if (product.priceCurrency === 'cdf') {
            priceUsd = convertCdfToUsd(product.price);
        } else {
            priceUsd = product.price;
        }
        totalValue += priceUsd * product.quantity;
    });
    
    // Trouver les produits les plus vendus (simulation)
    const topProducts = [...products]
        .sort(() => 0.5 - Math.random())
        .slice(0, 3);
    
    const currentDate = new Date();
    const formattedDate = currentDate.toLocaleDateString('fr-FR', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
    
    let messageContent = `
        <div class="ai-report-card">
            <div class="ai-report-header">
                <div class="ai-report-title">Rapport d'inventaire</div>
                <div class="ai-report-date">${formattedDate}</div>
            </div>
            
            <div class="ai-report-content">
                <div class="ai-report-section">
                    <div class="ai-report-section-title">Résumé</div>
                    <p>Votre inventaire contient actuellement ${totalProducts} produits pour une valeur totale de ${formatPriceForDisplay(totalValue, 'usd')}.</p>
                    <p>${lowStockCount} produits sont en stock faible et ${outOfStockCount} produits sont en rupture de stock.</p>
                </div>
                
                <div class="ai-report-section">
                    <div class="ai-report-section-title">Produits à réapprovisionner</div>
    `;
    
    const lowStockProducts = products.filter(p => p.quantity > 0 && p.quantity <= p.minStock);
    if (lowStockProducts.length > 0) {
        messageContent += `<div class="ai-inventory-list">`;
        lowStockProducts.slice(0, 5).forEach(product => {
            messageContent += `
                <div class="ai-inventory-item">
                    <div class="ai-item-name">${product.name}</div>
                    <div class="ai-item-quantity">${product.quantity}/${product.minStock}</div>
                </div>
            `;
        });
        
        if (lowStockProducts.length > 5) {
            messageContent += `<div class="ai-inventory-item">
                <div class="ai-item-name">Et ${lowStockProducts.length - 5} autres produits...</div>
            </div>`;
        }
        
        messageContent += `</div>`;
    } else {
        messageContent += `<p>Aucun produit n'est en stock faible. Excellent travail !</p>`;
    }
    
    messageContent += `
                </div>
                
                <div class="ai-report-section">
                    <div class="ai-report-section-title">Recommandations</div>
                    <ul>
    `;
    
    if (lowStockCount > 0) {
        messageContent += `<li>Réapprovisionnez les ${lowStockCount} produits en stock faible dès que possible.</li>`;
    }
    
    if (outOfStockCount > 0) {
        messageContent += `<li>Commandez de nouveaux stocks pour les ${outOfStockCount} produits en rupture.</li>`;
    }
    
    messageContent += `
                        <li>Vérifiez régulièrement vos niveaux de stock pour éviter les ruptures.</li>
                    </ul>
                </div>
            </div>
        </div>
    `;
    
    addAiMessage({
        type: 'ai',
        content: messageContent
    });
    
    // Enregistrer la date du dernier rapport
    aiUserPreferences.lastReportDate = new Date().toISOString();
    localStorage.setItem('totalAiPreferences', JSON.stringify(aiUserPreferences));
    
    // Options après le rapport
    const options = [
        { icon: 'fas fa-chart-line', text: 'Voir mon inventaire', action: 'showInventorySummary' },
        { icon: 'fas fa-exclamation-triangle', text: 'Produits en stock faible', action: 'showLowStockProducts' },
        { icon: 'fas fa-cog', text: 'Configurer les rapports', action: 'configureReports' },
        { icon: 'fas fa-home', text: 'Menu principal', action: 'showMainOptions' }
    ];
    
    renderOptions(options);
    
    // Vérifier la satisfaction
    setTimeout(() => {
        checkSatisfaction("Ce rapport vous a-t-il été utile ?");
    }, 1000);
}

function configureReports() {
    addAiMessage({
        type: 'ai',
        content: `
            <p>Configurons vos préférences pour les rapports automatiques.</p>
            <div style="background: #f8f9fa; border-radius: 10px; padding: 15px; margin-top: 10px;">
                <div style="margin-bottom: 15px;">
                    <label style="display: block; margin-bottom: 5px; font-weight: 600;">Heure du rapport journalier :</label>
                    <select id="ai-report-time" class="form-select" style="width: 100%; padding: 8px; border-radius: 5px; border: 1px solid #ddd;">
                        <option value="08:00" ${aiUserPreferences.reportTime === '08:00' ? 'selected' : ''}>8:00 (Matin)</option>
                        <option value="12:00" ${aiUserPreferences.reportTime === '12:00' ? 'selected' : ''}>12:00 (Midi)</option>
                        <option value="18:00" ${aiUserPreferences.reportTime === '18:00' ? 'selected' : ''}>18:00 (Soir)</option>
                        <option value="22:00" ${aiUserPreferences.reportTime === '22:00' ? 'selected' : ''}>22:00 (Nuit)</option>
                    </select>
                </div>
                
                <div style="margin-bottom: 15px;">
                    <label style="display: block; margin-bottom: 5px; font-weight: 600;">Fréquence des rapports :</label>
                    <select id="ai-report-frequency" class="form-select" style="width: 100%; padding: 8px; border-radius: 5px; border: 1px solid #ddd;">
                        <option value="daily" ${aiUserPreferences.reportFrequency === 'daily' ? 'selected' : ''}>Quotidien</option>
                        <option value="weekly" ${aiUserPreferences.reportFrequency === 'weekly' ? 'selected' : ''}>Hebdomadaire</option>
                        <option value="monthly" ${aiUserPreferences.reportFrequency === 'monthly' ? 'selected' : ''}>Mensuel</option>
                    </select>
                </div>
                
                <button id="ai-save-preferences" style="background: var(--primary); color: white; border: none; padding: 10px 15px; border-radius: 5px; cursor: pointer; width: 100%;">
                    Enregistrer mes préférences
                </button>
            </div>
        `
    });
    
    // Ajouter l'événement pour enregistrer les préférences
    setTimeout(() => {
        document.getElementById('ai-save-preferences').addEventListener('click', saveReportPreferences);
    }, 100);
    
    // Options après la configuration
    const options = [
        { icon: 'fas fa-file-alt', text: 'Générer un rapport maintenant', action: 'generateDailyReport' },
        { icon: 'fas fa-home', text: 'Menu principal', action: 'showMainOptions' }
    ];
    
    renderOptions(options);
}

function saveReportPreferences() {
    const reportTime = document.getElementById('ai-report-time').value;
    const reportFrequency = document.getElementById('ai-report-frequency').value;
    
    aiUserPreferences.reportTime = reportTime;
    aiUserPreferences.reportFrequency = reportFrequency;
    localStorage.setItem('totalAiPreferences', JSON.stringify(aiUserPreferences));
    
    addAiMessage({
        type: 'user',
        content: `<p>Enregistrer mes préférences</p>`
    });
    
    // Effacer les options
    document.getElementById('ai-options').innerHTML = '';
    
    // Montrer l'indicateur de frappe
    showTypingIndicator();
    
    // Simuler un délai pour une expérience plus naturelle
    setTimeout(() => {
        removeTypingIndicator();
        
        addAiMessage({
            type: 'ai',
            content: `
                <p>Vos préférences ont été enregistrées avec succès ! 👍</p>
                <p>Vous recevrez désormais vos rapports ${reportFrequency === 'daily' ? 'tous les jours' : reportFrequency === 'weekly' ? 'toutes les semaines' : 'tous les mois'} à ${reportTime}.</p>
                <p>Que souhaitez-vous faire maintenant ?</p>
            `
        });
        
        showMainOptions();
    }, 1000);
}

function checkSatisfaction(question) {
    addAiMessage({
        type: 'ai',
        content: `
            <p>${question}</p>
            <div class="ai-satisfaction">
                <div class="ai-satisfaction-option" data-value="very-satisfied">
                    <div class="ai-satisfaction-icon">😁</div>
                    <div class="ai-satisfaction-text">Très satisfait</div>
                </div>
                <div class="ai-satisfaction-option" data-value="satisfied">
                    <div class="ai-satisfaction-icon">🙂</div>
                    <div class="ai-satisfaction-text">Satisfait</div>
                </div>
                <div class="ai-satisfaction-option" data-value="neutral">
                    <div class="ai-satisfaction-icon">😐</div>
                    <div class="ai-satisfaction-text">Neutre</div>
                </div>
                <div class="ai-satisfaction-option" data-value="unsatisfied">
                    <div class="ai-satisfaction-icon">😕</div>
                    <div class="ai-satisfaction-text">Pas satisfait</div>
                </div>
            </div>
        `
    });
    
    // Ajouter les événements pour les options de satisfaction
    setTimeout(() => {
        document.querySelectorAll('.ai-satisfaction-option').forEach(option => {
            option.addEventListener('click', function() {
                const value = this.getAttribute('data-value');
                handleSatisfactionFeedback(value);
            });
        });
    }, 100);
}

function handleSatisfactionFeedback(value) {
    // Ajouter la sélection de l'utilisateur comme message
    const satisfactionTexts = {
        'very-satisfied': 'Très satisfait',
        'satisfied': 'Satisfait',
        'neutral': 'Neutre',
        'unsatisfied': 'Pas satisfait'
    };
    
    addAiMessage({
        type: 'user',
        content: `<p>${satisfactionTexts[value]}</p>`
    });
    
    // Effacer les options
    document.getElementById('ai-options').innerHTML = '';
    
    // Montrer l'indicateur de frappe
    showTypingIndicator();
    
    // Simuler un délai pour une expérience plus naturelle
    setTimeout(() => {
        removeTypingIndicator();
        
        if (value === 'very-satisfied' || value === 'satisfied') {
            addAiMessage({
                type: 'ai',
                content: `
                    <p>Merci pour votre retour positif ! 😊</p>
                    <p>Je suis ravi de pouvoir vous aider efficacement dans la gestion de votre inventaire.</p>
                    <p>N'hésitez pas à me solliciter pour toute autre question ou assistance.</p>
                `
            });
            
            showMainOptions();
        } else if (value === 'neutral') {
            addAiMessage({
                type: 'ai',
                content: `
                    <p>Merci pour votre retour.</p>
                    <p>Comment puis-je améliorer mon aide pour mieux répondre à vos besoins ?</p>
                `
            });
            
            // Options pour l'amélioration
            const options = [
                { icon: 'fas fa-info-circle', text: 'Plus de détails', action: 'handleImprovementFeedback', data: 'more-details' },
                { icon: 'fas fa-bolt', text: 'Plus rapide', action: 'handleImprovementFeedback', data: 'faster' },
                { icon: 'fas fa-chart-pie', text: 'Plus de statistiques', action: 'handleImprovementFeedback', data: 'more-stats' },
                { icon: 'fas fa-home', text: 'Menu principal', action: 'showMainOptions' }
            ];
            
            renderOptionsWithData(options);
        } else {
            addAiMessage({
                type: 'ai',
                content: `
                    <p>Je suis désolé que mon assistance ne vous ait pas satisfait. 😔</p>
                    <p>Pourriez-vous me dire ce qui n'a pas répondu à vos attentes ?</p>
                `
            });
            
            // Options pour le feedback négatif
            const options = [
                { icon: 'fas fa-info-circle', text: 'Informations inexactes', action: 'handleNegativeFeedback', data: 'inaccurate' },
                { icon: 'fas fa-exclamation-triangle', text: 'Trop compliqué', action: 'handleNegativeFeedback', data: 'too-complex' },
                { icon: 'fas fa-question-circle', text: 'N\'a pas répondu à ma question', action: 'handleNegativeFeedback', data: 'not-helpful' },
                { icon: 'fas fa-home', text: 'Menu principal', action: 'showMainOptions' }
            ];
            
            renderOptionsWithData(options);
        }
    }, 1000);
}

function renderOptionsWithData(options) {
    const optionsContainer = document.getElementById('ai-options');
    optionsContainer.innerHTML = '';
    
    // Vérifier si le conteneur parent existe, sinon le créer
    let optionsParentContainer = document.querySelector('.ai-options-container');
    if (!optionsParentContainer) {
        optionsParentContainer = document.createElement('div');
        optionsParentContainer.className = 'ai-options-container';
        optionsContainer.parentNode.replaceChild(optionsParentContainer, optionsContainer);
        optionsParentContainer.appendChild(optionsContainer);
        
        // Ajouter le bouton de toggle pour changer l'orientation
        const toggleButton = document.createElement('div');
        toggleButton.className = 'ai-options-layout-toggle';
        toggleButton.innerHTML = '<i class="fas fa-list"></i>';
        toggleButton.addEventListener('click', toggleOptionsLayout);
        optionsParentContainer.appendChild(toggleButton);
    }
    
    options.forEach(option => {
        const optionEl = document.createElement('div');
        optionEl.className = 'ai-option';
        optionEl.innerHTML = `<i class="${option.icon}"></i> ${option.text}`;
        
        optionEl.addEventListener('click', () => {
            // Ajouter la sélection de l'utilisateur comme message
            addAiMessage({
                type: 'user',
                content: `<p>${option.text}</p>`
            });
            
            // Effacer les options
            optionsContainer.innerHTML = '';
            
            // Montrer l'indicateur de frappe
            showTypingIndicator();
            
            // Simuler un délai pour une expérience plus naturelle
            setTimeout(() => {
                removeTypingIndicator();
                
                // Exécuter l'action associée avec les données si nécessaire
                if (option.action === 'handleImprovementFeedback') {
                    handleImprovementFeedback(option.data);
                } else if (option.action === 'handleNegativeFeedback') {
                    handleNegativeFeedback(option.data);
                } else {
                    window[option.action]();
                }
            }, 1000);
        });
        
        optionsContainer.appendChild(optionEl);
    });
    
    // Faire défiler automatiquement vers le début des options
    optionsContainer.scrollLeft = 0;
}


function handleImprovementFeedback(type) {
    let response = '';
    
    switch(type) {
        case 'more-details':
            response = `
                <p>Merci pour votre retour !</p>
                <p>Je vais m'efforcer de fournir des informations plus détaillées à l'avenir.</p>
                <p>N'hésitez pas à me demander plus de détails à tout moment si vous en avez besoin.</p>
            `;
            break;
        case 'faster':
            response = `
                <p>Merci pour votre retour !</p>
                <p>Je comprends que la rapidité est importante pour vous. Je vais travailler à optimiser mes réponses.</p>
                <p>Votre temps est précieux et je ferai mon possible pour être plus efficace.</p>
            `;
            break;
        case 'more-stats':
            response = `
                <p>Merci pour votre retour !</p>
                <p>Je vais améliorer les analyses statistiques et les visualisations de données dans mes rapports.</p>
                <p>Les statistiques sont essentielles pour une bonne gestion d'inventaire.</p>
            `;
            break;
    }
    
    addAiMessage({
        type: 'ai',
        content: response
    });
    
    showMainOptions();
}

function handleNegativeFeedback(type) {
    let response = '';
    
    switch(type) {
        case 'inaccurate':
            response = `
                <p>Je vous présente mes excuses pour les informations inexactes.</p>
                <p>Votre feedback est très important et m'aidera à améliorer la qualité et la précision des informations que je vous fournis.</p>
                <p>N'hésitez pas à me corriger à tout moment si vous constatez des erreurs.</p>
            `;
            break;
        case 'too-complex':
            response = `
                <p>Je vous remercie pour ce retour précieux.</p>
                <p>Je vais simplifier mes explications et présenter l'information de façon plus claire et concise.</p>
                <p>Mon objectif est de vous faciliter la gestion de votre inventaire, pas de la compliquer.</p>
            `;
            break;
        case 'not-helpful':
            response = `
                <p>Je suis désolé de ne pas avoir répondu à votre question de manière satisfaisante.</p>
                <p>Je vais travailler à mieux comprendre vos besoins et à fournir des réponses plus pertinentes.</p>
                <p>N'hésitez pas à reformuler votre question ou à me préciser ce que vous recherchez.</p>
            `;
            break;
    }
    
    addAiMessage({
        type: 'ai',
        content: response
    });
    
    showMainOptions();
}

// Fonctions d'intégration avec l'application existante
function openProductModalFromAi(productId) {
    addAiMessage({
        type: 'ai',
        content: `
            <p>Je vous ouvre la fenêtre de modification du produit.</p>
            <p>Vous pourrez y mettre à jour toutes les informations.</p>
        `
    });
    
    setTimeout(() => {
        openProductModal(productId);
    }, 1000);
}

function openSellModalFromAi(productId) {
    addAiMessage({
        type: 'ai',
        content: `
            <p>Je vous ouvre la fenêtre de vente du produit.</p>
            <p>Vous pourrez y enregistrer une nouvelle vente.</p>
        `
    });
    
    setTimeout(() => {
        openSellModal(productId);
    }, 1000);
}

function restockProductFromAi(productId) {
    const product = products.find(p => p.id === productId);
    
    if (!product) {
        addAiMessage({
            type: 'ai',
            content: `<p>Désolé, je ne trouve pas ce produit dans votre inventaire.</p>`
        });
        
        showMainOptions();
        return;
    }
    
    addAiMessage({
        type: 'ai',
        content: `
            <p>Combien d'unités de "${product.name}" souhaitez-vous ajouter au stock ?</p>
            <div style="display: flex; gap: 10px; margin-top: 15px; flex-wrap: wrap; justify-content: center;">
                <button class="ai-restock-btn" data-quantity="5" data-id="${product.id}">+5</button>
                <button class="ai-restock-btn" data-quantity="10" data-id="${product.id}">+10</button>
                <button class="ai-restock-btn" data-quantity="20" data-id="${product.id}">+20</button>
                <button class="ai-restock-btn" data-quantity="50" data-id="${product.id}">+50</button>
                <button class="ai-restock-btn" data-quantity="custom" data-id="${product.id}">Autre quantité</button>
            </div>
            <style>
                .ai-restock-btn {
                    background: #f0f4f8;
                    border: 1px solid #ddd;
                    padding: 8px 15px;
                    border-radius: 5px;
                    cursor: pointer;
                    transition: all 0.2s;
                }
                .ai-restock-btn:hover {
                    background: var(--primary);
                    color: white;
                    border-color: var(--primary);
                }
            </style>
        `
    });
    
    // Ajouter les événements pour les boutons de réapprovisionnement
    setTimeout(() => {
        document.querySelectorAll('.ai-restock-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const quantity = this.getAttribute('data-quantity');
                const productId = this.getAttribute('data-id');
                
                if (quantity === 'custom') {
                    showCustomRestockInput(productId);
                } else {
                    processRestock(productId, parseInt(quantity));
                }
            });
        });
    }, 100);
}

function showCustomRestockInput(productId) {
    const product = products.find(p => p.id === productId);
    
    addAiMessage({
        type: 'user',
        content: `<p>Autre quantité</p>`
    });
    
    addAiMessage({
        type: 'ai',
        content: `
            <p>Veuillez saisir la quantité de "${product.name}" que vous souhaitez ajouter :</p>
            <div style="display: flex; gap: 10px; margin-top: 15px;">
                <input type="number" id="custom-restock-quantity" min="1" value="1" style="flex: 1; padding: 8px; border-radius: 5px; border: 1px solid #ddd;">
                <button id="confirm-custom-restock" data-id="${productId}" style="background: var(--primary); color: white; border: none; padding: 8px 15px; border-radius: 5px; cursor: pointer;">
                    Confirmer
                </button>
            </div>
        `
    });
    
    // Ajouter l'événement pour le bouton de confirmation
    setTimeout(() => {
        document.getElementById('confirm-custom-restock').addEventListener('click', function() {
            const quantity = parseInt(document.getElementById('custom-restock-quantity').value);
            const productId = this.getAttribute('data-id');
            
            if (isNaN(quantity) || quantity <= 0) {
                addAiMessage({
                    type: 'ai',
                    content: `<p>Veuillez saisir une quantité valide (supérieure à 0).</p>`
                });
                return;
            }
            
            processRestock(productId, quantity);
        });
    }, 100);
}

function processRestock(productId, quantity) {
    // Trouver le produit
    const productIndex = products.findIndex(p => p.id === productId);
    
    if (productIndex === -1) {
        addAiMessage({
            type: 'ai',
            content: `<p>Désolé, je ne trouve pas ce produit dans votre inventaire.</p>`
        });
        
        showMainOptions();
        return;
    }
    
    // Mettre à jour la quantité
    const product = products[productIndex];
    const oldQuantity = product.quantity;
    product.quantity += quantity;
    
    // Ajouter un mouvement
    product.movements = product.movements || [];
    product.movements.push({
        type: "add",
        quantity: quantity,
        date: new Date().toISOString(),
        description: "Réapprovisionnement via l'assistant IA"
    });
    
    // Mettre à jour le stockage local
    products[productIndex] = product;
    updateLocalStorage();
    
    // Mettre à jour l'affichage
    updateDashboardStats();
    loadRecentProducts();
    loadInventoryTable();
    
    // Afficher un message de confirmation
    addAiMessage({
        type: 'user',
        content: `<p>Ajouter ${quantity} unités</p>`
    });
    
    addAiMessage({
        type: 'ai',
        content: `
            <p>J'ai ajouté ${quantity} unités de "${product.name}" à votre inventaire. ✅</p>
            <p>La quantité est passée de ${oldQuantity} à ${product.quantity}.</p>
            <p>Que souhaitez-vous faire maintenant ?</p>
        `
    });
    
    // Options après le réapprovisionnement
    const options = [
        { icon: 'fas fa-chart-line', text: 'Voir mon inventaire', action: 'showInventorySummary' },
        { icon: 'fas fa-plus-circle', text: 'Réapprovisionner un autre produit', action: 'showSearchProduct' },
        { icon: 'fas fa-home', text: 'Menu principal', action: 'showMainOptions' }
    ];
    
    renderOptions(options);
}

function printProductCodesFromAi(productId) {
    addAiMessage({
        type: 'ai',
        content: `
            <p>Je vous dirige vers l'impression des codes pour ce produit.</p>
        `
    });
    
    setTimeout(() => {
        printProductCodes(productId);
    }, 1000);
}

// Initialisation et événements pour l'Assistant IA
document.addEventListener('DOMContentLoaded', function() {
    // Ajouter les événements pour l'IA
    document.getElementById('ai-reset').addEventListener('click', initAiAssistant);
    
    document.getElementById('ai-save-pdf').addEventListener('click', function() {
        savePdf('ai-messages', 'Assistant_IA_Rapport');
    });
    
    document.getElementById('ai-print').addEventListener('click', function() {
        printElement('ai-messages');
    });
    
    document.getElementById('ai-copy').addEventListener('click', function() {
        copyConversationToClipboard();
    });
    
    document.getElementById('ai-share').addEventListener('click', function() {
        shareConversation();
    });
    
    // Vérifier s'il faut envoyer un rapport automatique
    checkAutomaticReport();
});

function savePdf(elementId, filename) {
    const element = document.getElementById(elementId);
    
    // Simuler le téléchargement
    addAiMessage({
        type: 'user',
        content: `<p>Enregistrer en PDF</p>`
    });
    
    showTypingIndicator();
    
    setTimeout(() => {
        removeTypingIndicator();
        
        addAiMessage({
            type: 'ai',
            content: `
                <p>Le rapport a été enregistré en PDF avec succès ! ✅</p>
                <p>Vous pouvez maintenant l'ouvrir ou le partager avec votre équipe.</p>
            `
        });
    }, 1500);
}

function printElement(elementId) {
    const element = document.getElementById(elementId);
    
    // Simuler l'impression
    addAiMessage({
        type: 'user',
        content: `<p>Imprimer</p>`
    });
    
    showTypingIndicator();
    
    setTimeout(() => {
        removeTypingIndicator();
        
        addAiMessage({
            type: 'ai',
            content: `
                <p>La conversation a été envoyée à l'imprimante. ✅</p>
                <p>Vérifiez votre imprimante pour récupérer le document.</p>
            `
        });
    }, 1500);
}

function copyConversationToClipboard() {
    // Simuler la copie
    addAiMessage({
        type: 'user',
        content: `<p>Copier</p>`
    });
    
    showTypingIndicator();
    
    setTimeout(() => {
        removeTypingIndicator();
        
        addAiMessage({
            type: 'ai',
            content: `
                <p>La conversation a été copiée dans le presse-papier. ✅</p>
                <p>Vous pouvez maintenant la coller où vous le souhaitez.</p>
            `
        });
    }, 1000);
}

function shareConversation() {
    // Simuler le partage
    addAiMessage({
        type: 'user',
        content: `<p>Partager</p>`
    });
    
    showTypingIndicator();
    
    setTimeout(() => {
        removeTypingIndicator();
        
        addAiMessage({
            type: 'ai',
            content: `
                <p>Comment souhaitez-vous partager cette conversation ?</p>
            `
        });
        
        const options = [
            { icon: 'fas fa-envelope', text: 'Par email', action: 'shareByEmail' },
            { icon: 'fab fa-whatsapp', text: 'WhatsApp', action: 'shareByWhatsApp' },
            { icon: 'fas fa-link', text: 'Copier le lien', action: 'shareCopyLink' },
            { icon: 'fas fa-home', text: 'Menu principal', action: 'showMainOptions' }
        ];
        
        renderOptions(options);
    }, 1000);
}

function shareByEmail() {
    addAiMessage({
        type: 'ai',
        content: `
            <p>Un email contenant cette conversation a été préparé dans votre application de messagerie par défaut. ✅</p>
            <p>Vous pouvez maintenant l'envoyer à vos collaborateurs.</p>
        `
    });
    
    showMainOptions();
}

function shareByWhatsApp() {
    addAiMessage({
        type: 'ai',
        content: `
            <p>La conversation a été partagée sur WhatsApp. ✅</p>
            <p>Vos collaborateurs peuvent maintenant la consulter.</p>
        `
    });
    
    showMainOptions();
}

function shareCopyLink() {
    addAiMessage({
        type: 'ai',
        content: `
            <p>Le lien vers cette conversation a été copié dans votre presse-papier. ✅</p>
            <p>Vous pouvez maintenant le partager où vous le souhaitez.</p>
        `
    });
    
    showMainOptions();
}

function checkAutomaticReport() {
    // Vérifier si un rapport automatique doit être envoyé
    const now = new Date();
    const reportTime = aiUserPreferences.reportTime || '18:00';
    const [hours, minutes] = reportTime.split(':').map(Number);
    
    // Si l'heure actuelle correspond à l'heure de rapport (à 5 minutes près)
    if (now.getHours() === hours && Math.abs(now.getMinutes() - minutes) <= 5) {
        // Vérifier la fréquence
        const lastReportDate = aiUserPreferences.lastReportDate ? new Date(aiUserPreferences.lastReportDate) : null;
        let shouldSendReport = false;
        
        if (!lastReportDate) {
            shouldSendReport = true;
        } else {
            const daysSinceLastReport = Math.floor((now - lastReportDate) / (1000 * 60 * 60 * 24));
            
            if (aiUserPreferences.reportFrequency === 'daily' && daysSinceLastReport >= 1) {
                shouldSendReport = true;
            } else if (aiUserPreferences.reportFrequency === 'weekly' && daysSinceLastReport >= 7) {
                shouldSendReport = true;
            } else if (aiUserPreferences.reportFrequency === 'monthly' && daysSinceLastReport >= 30) {
                shouldSendReport = true;
            }
        }
        
        if (shouldSendReport) {
            // Si l'utilisateur est sur la section IA, générer le rapport
            if (document.getElementById('ai-assistant').style.display !== 'none') {
                addAiMessage({
                    type: 'ai',
                    content: `
                        <p>C'est l'heure de votre rapport ${aiUserPreferences.reportFrequency === 'daily' ? 'quotidien' : aiUserPreferences.reportFrequency === 'weekly' ? 'hebdomadaire' : 'mensuel'} ! 📊</p>
                        <p>Voici un résumé de votre inventaire :</p>
                    `
                });
                
                generateDailyReport();
            } else {
                // Sinon, afficher une notification
                showNotification('Rapport automatique', 'Votre rapport d\'inventaire est prêt à être consulté.', 'info');
            }
        }
    }
}




/*══════════════════════════════╗
  🟡 JS PARTIE 6
  ═════════════════════════════╝*/




//══════════════════════════════╗
// 🟤 JS PARTIE 7
//══════════════════════════════╝
// Initialisation des dropdowns personnalisés
function initCustomDropdowns() {
    document.querySelectorAll('.custom-dropdown').forEach(dropdown => {
        const selected = dropdown.querySelector('.custom-dropdown-selected');
        const menu = dropdown.querySelector('.custom-dropdown-menu');
        const items = dropdown.querySelectorAll('.custom-dropdown-item');
        const input = dropdown.querySelector('input[type="hidden"]');
        const search = dropdown.querySelector('.custom-dropdown-search input');
        
        // Toggle menu
        selected.addEventListener('click', function() {
            menu.classList.toggle('show');
            if (search) {
                setTimeout(() => search.focus(), 100);
            }
        });
        
        // Close menu when clicking outside
        document.addEventListener('click', function(e) {
            // Ne pas fermer si on clique sur une icône d'info
            if (e.target.classList.contains('info_unit_mesure') || 
                e.target.closest('.info-tooltip-container')) {
                return;
            }
            
            if (!dropdown.contains(e.target)) {
                menu.classList.remove('show');
            }
        });
        
        // Item selection
        items.forEach(item => {
            item.addEventListener('click', function(e) {
                // Ne pas sélectionner l'élément si on a cliqué sur l'icône d'info
                if (e.target.classList.contains('info_unit_mesure') || 
                    e.target.closest('.info-tooltip-container')) {
                    return;
                }
                
                if (this.classList.contains('add-new')) {
                    showCustomUnitModal(dropdown);
                } else {
                    const value = this.dataset.value;
                    // Utiliser l'icône de l'élément sélectionné, pas une valeur par défaut
                    const iconElement = this.querySelector('i:first-child');
                    const iconClass = iconElement ? iconElement.className : 'fas fa-box me-2';
                    
                    // Extraire uniquement le texte visible sans le contenu de l'info-tooltip
                    const itemClone = this.cloneNode(true);
                    const tooltipContainer = itemClone.querySelector('.info-tooltip-container');
                    if (tooltipContainer) {
                        tooltipContainer.remove();
                    }
                    const text = itemClone.textContent.trim();
                    
                    selected.querySelector('.selected-text').innerHTML = `<i class="${iconClass}"></i>${text}`;
                    input.value = value;
                    
                    items.forEach(i => i.classList.remove('active'));
                    this.classList.add('active');
                    
                    menu.classList.remove('show');
                }
            });
        });
        
        // Filter items on search
        if (search) {
            search.addEventListener('input', function() {
                const value = this.value.toLowerCase();
                const groups = dropdown.querySelectorAll('.custom-dropdown-group');
                
                items.forEach(item => {
                    if (!item.classList.contains('add-new')) {
                        const text = item.textContent.toLowerCase();
                        const show = text.includes(value);
                        item.style.display = show ? '' : 'none';
                    }
                });
                
                // Show/hide group headers based on visible items
                groups.forEach(group => {
                    const groupItems = group.querySelectorAll('.custom-dropdown-item');
                    const visibleItems = Array.from(groupItems).filter(item => 
                        item.style.display !== 'none'
                    ).length;
                    
                    const header = group.querySelector('.custom-dropdown-group-header');
                    if (header) {
                        header.style.display = visibleItems > 0 ? '' : 'none';
                    }
                });
            });
            
            // Prevent dropdown closing on search input click
            search.addEventListener('click', function(e) {
                e.stopPropagation();
            });
        }
    });
}




// Afficher la modal pour ajouter une unité personnalisée
function showCustomUnitModal(dropdown) {
    // Create modal if it doesn't exist
    if (!document.getElementById('customUnitModal')) {
        const modalHTML = `
            <div class="custom-unit-modal" id="customUnitModal">
                <div class="custom-unit-content">
                    <div class="custom-unit-header">
                        <h5 class="custom-unit-title">Ajouter une unité personnalisée</h5>
                        <button type="button" class="custom-unit-close" id="closeCustomUnit">&times;</button>
                    </div>
                    <div class="custom-unit-body">
                        <div class="mb-3">
                            <label for="custom-unit-name" class="form-label">Nom de l'unité</label>
                            <input type="text" class="form-control" id="custom-unit-name" placeholder="Ex: Sachet, Flacon, etc.">
                        </div>
                    </div>
                    <div class="custom-unit-footer">
                        <button type="button" class="btn btn-secondary" id="cancelCustomUnit">Annuler</button>
                        <button type="button" class="btn btn-primary" id="saveCustomUnit">Ajouter</button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        
        // Close events
        document.getElementById('closeCustomUnit').addEventListener('click', closeCustomUnitModal);
        document.getElementById('cancelCustomUnit').addEventListener('click', closeCustomUnitModal);
        
        // Save custom unit
        document.getElementById('saveCustomUnit').addEventListener('click', function() {
            const unitName = document.getElementById('custom-unit-name').value.trim();
            if (unitName) {
                addCustomUnit(unitName, dropdown);
                closeCustomUnitModal();
            }
        });
    }
    
    // Show modal
    document.getElementById('customUnitModal').classList.add('show');
    setTimeout(() => document.getElementById('custom-unit-name').focus(), 100);
}

// Fermer la modal d'unité personnalisée
function closeCustomUnitModal() {
    const modal = document.getElementById('customUnitModal');
    if (modal) {
        modal.classList.remove('show');
        document.getElementById('custom-unit-name').value = '';
    }
}

// Ajouter une unité personnalisée
function addCustomUnit(unitName, dropdown) {
    // Generate a unique value for the custom unit
    const unitValue = 'custom-' + Date.now();
    
    // Get the custom units from localStorage or create empty array
    let customUnits = JSON.parse(localStorage.getItem('customUnits') || '[]');
    
    // Add the new unit
    customUnits.push({
        value: unitValue,
        name: unitName
    });
    
    // Save to localStorage
    localStorage.setItem('customUnits', JSON.stringify(customUnits));
    
    // Add to all dropdowns
    document.querySelectorAll('.custom-dropdown').forEach(dropdown => {
        const items = dropdown.querySelector('.custom-dropdown-items');
        const addNewItem = items.querySelector('.add-new');
        
        // Check if this custom unit already exists in this dropdown
        if (!items.querySelector(`[data-value="${unitValue}"]`)) {
            const newItem = document.createElement('div');
            newItem.className = 'custom-dropdown-item';
            newItem.dataset.value = unitValue;
            newItem.dataset.icon = 'fas fa-box';
            newItem.innerHTML = `
                <i class="fas fa-box me-2"></i>${unitName}
                <span class="info-tooltip-container">
                    <i class="fas fa-info-circle ms-2 info-icon info_unit_mesure"></i>
                    <span class="info-tooltip">Unité personnalisée</span>
                </span>
            `;
            
            // Insert before the "Add new" item
            if (addNewItem) {
                items.insertBefore(newItem, addNewItem);
            } else {
                items.appendChild(newItem);
            }
            
            // Add click event
            newItem.addEventListener('click', function(e) {
                // Ne pas sélectionner l'élément si on a cliqué sur l'icône d'info
                if (e.target.classList.contains('info_unit_mesure') || 
                    e.target.closest('.info-tooltip-container')) {
                    return;
                }
                
                const selected = dropdown.querySelector('.custom-dropdown-selected');
                const input = dropdown.querySelector('input[type="hidden"]');
                
                // Extraire uniquement le texte visible sans le contenu de l'info-tooltip
                const itemClone = this.cloneNode(true);
                const tooltipContainer = itemClone.querySelector('.info-tooltip-container');
                if (tooltipContainer) {
                    tooltipContainer.remove();
                }
                const text = itemClone.textContent.trim();
                
                // Utiliser l'icône de l'élément sélectionné
                const iconElement = this.querySelector('i:first-child');
                const iconClass = iconElement ? iconElement.className : 'fas fa-box me-2';
                
                selected.querySelector('.selected-text').innerHTML = `<i class="${iconClass}"></i>${text}`;
                input.value = unitValue;
                
                dropdown.querySelectorAll('.custom-dropdown-item').forEach(i => i.classList.remove('active'));
                this.classList.add('active');
                
                dropdown.querySelector('.custom-dropdown-menu').classList.remove('show');
            });
            
            // Réinitialiser les info-bulles
            initInfoUnitMesureTooltips();
        }
    });
    
    // Select the newly added unit in the current dropdown
    if (dropdown) {
        const selected = dropdown.querySelector('.custom-dropdown-selected');
        const input = dropdown.querySelector('input[type="hidden"]');
        
        selected.querySelector('.selected-text').innerHTML = `<i class="fas fa-box me-2"></i>${unitName}`;
        input.value = unitValue;
        
        dropdown.querySelector('.custom-dropdown-menu').classList.remove('show');
    }
}





// Charger les unités personnalisées au démarrage
function loadCustomUnits() {
    const customUnits = JSON.parse(localStorage.getItem('customUnits') || '[]');
    
    if (customUnits.length > 0) {
        document.querySelectorAll('.custom-dropdown').forEach(dropdown => {
            const items = dropdown.querySelector('.custom-dropdown-items');
            const addNewItem = items.querySelector('.add-new');
            
            customUnits.forEach(unit => {
                // Check if this custom unit already exists in this dropdown
                if (!items.querySelector(`[data-value="${unit.value}"]`)) {
                    const newItem = document.createElement('div');
                    newItem.className = 'custom-dropdown-item';
                    newItem.dataset.value = unit.value;
                    newItem.dataset.icon = 'fas fa-box';
                    newItem.innerHTML = `
                        <i class="fas fa-box me-2"></i>${unit.name}
                        <span class="info-tooltip-container">
                            <i class="fas fa-info-circle ms-2 info-icon info_unit_mesure"></i>
                            <span class="info-tooltip">Unité personnalisée</span>
                        </span>
                    `;
                    
                    // Insert before the "Add new" item
                    if (addNewItem) {
                        items.insertBefore(newItem, addNewItem);
                    } else {
                        items.appendChild(newItem);
                    }
                    
                    // Add click event
                    newItem.addEventListener('click', function(e) {
                        // Ne pas sélectionner l'élément si on a cliqué sur l'icône d'info
                        if (e.target.classList.contains('info_unit_mesure') || 
                            e.target.closest('.info-tooltip-container')) {
                            return;
                        }
                        
                        const selected = dropdown.querySelector('.custom-dropdown-selected');
                        const input = dropdown.querySelector('input[type="hidden"]');
                        
                        // Extraire uniquement le texte visible sans le contenu de l'info-tooltip
                        const itemClone = this.cloneNode(true);
                        const tooltipContainer = itemClone.querySelector('.info-tooltip-container');
                        if (tooltipContainer) {
                            tooltipContainer.remove();
                        }
                        const text = itemClone.textContent.trim();
                        
                        // Utiliser l'icône de l'élément sélectionné
                        const iconElement = this.querySelector('i:first-child');
                        const iconClass = iconElement ? iconElement.className : 'fas fa-box me-2';
                        
                        selected.querySelector('.selected-text').innerHTML = `<i class="${iconClass}"></i>${text}`;
                        input.value = unit.value;
                        
                        dropdown.querySelectorAll('.custom-dropdown-item').forEach(i => i.classList.remove('active'));
                        this.classList.add('active');
                        
                        dropdown.querySelector('.custom-dropdown-menu').classList.remove('show');
                    });
                }
            });
            
            // Réinitialiser les info-bulles
            initInfoUnitMesureTooltips();
        });
    }
}





// Obtenir l'icône et le nom pour une unité donnée
function getUnitInfo(unitValue) {
    const defaultInfo = { icon: 'fas fa-tag', name: 'Pièce' };
    
    // Unités standard
    const standardUnits = {
        'piece': { icon: 'fas fa-tag', name: 'Pièce' },
        'lot': { icon: 'fas fa-layer-group', name: 'Lot' },
        'paquet': { icon: 'fas fa-box', name: 'Paquet' },
        'boite': { icon: 'fas fa-box-open', name: 'Boîte' },
        'carton': { icon: 'fas fa-dice-d6', name: 'Carton' },
        'kg': { icon: 'fas fa-weight', name: 'Kilogramme' },
        'litre': { icon: 'fas fa-tint', name: 'Litre' },
        'metre': { icon: 'fas fa-ruler-horizontal', name: 'Mètre' },
        'kit': { icon: 'fas fa-toolbox', name: 'Kit' },
        'pack': { icon: 'fas fa-gifts', name: 'Pack' }
    };
    
    // Si c'est une unité standard
    if (standardUnits[unitValue]) {
        return standardUnits[unitValue];
    }
    
    // Si c'est une unité personnalisée
    if (unitValue.startsWith('custom-')) {
        const customUnits = JSON.parse(localStorage.getItem('customUnits') || '[]');
        const customUnit = customUnits.find(unit => unit.value === unitValue);
        
        if (customUnit) {
            return { icon: 'fas fa-box', name: customUnit.name };
        }
    }
    
    return defaultInfo;
}



// Fonction pour positionner les tooltips de manière adaptative
function positionTooltips() {
    document.querySelectorAll('.info_unit_mesure.active').forEach(icon => {
        const tooltip = icon.nextElementSibling;
        if (!tooltip) return;
        
        // Réinitialiser les styles de positionnement
        tooltip.style.left = '';
        tooltip.style.right = '';
        tooltip.style.top = '';
        tooltip.style.bottom = '';
        tooltip.style.transform = '';
        tooltip.style.maxWidth = '';
        
        // Réinitialiser les classes de positionnement des flèches
        tooltip.classList.remove(
            'tooltip-top', 'tooltip-bottom', 'tooltip-left', 'tooltip-right',
            'arrow-left', 'arrow-right', 'arrow-center'
        );
        
        // Récupérer les dimensions et positions
        const iconRect = icon.getBoundingClientRect();
        const tooltipRect = tooltip.getBoundingClientRect();
        const parentMenu = icon.closest('.custom-dropdown-menu');
        const parentRect = parentMenu.getBoundingClientRect();
        
        // Largeur disponible à gauche et à droite de l'icône
        const spaceLeft = iconRect.left - parentRect.left;
        const spaceRight = parentRect.right - iconRect.right;
        
        // Espace disponible en haut et en bas
        const spaceTop = iconRect.top - parentRect.top;
        const spaceBottom = parentRect.bottom - iconRect.bottom;
        
        // Variable pour stocker la position horizontale de la flèche
        let arrowHorizontalClass = 'arrow-center';
        
        // Calcul de la position horizontale idéale
        if (spaceLeft > tooltipRect.width / 2 && spaceRight > tooltipRect.width / 2) {
            // Centrer si possible
            tooltip.style.left = '50%';
            tooltip.style.transform = 'translateX(-50%)';
            arrowHorizontalClass = 'arrow-center';
        } else if (spaceRight > tooltipRect.width) {
            // Aligner à gauche de l'icône
            tooltip.style.left = '0';
            arrowHorizontalClass = 'arrow-left';
        } else if (spaceLeft > tooltipRect.width) {
            // Aligner à droite de l'icône
            tooltip.style.right = '0';
            arrowHorizontalClass = 'arrow-right';
        } else {
            // Ajuster pour ne pas déborder
            if (spaceRight > spaceLeft) {
                tooltip.style.left = '0';
                tooltip.style.maxWidth = spaceRight + 'px';
                arrowHorizontalClass = 'arrow-left';
            } else {
                tooltip.style.right = '0';
                tooltip.style.maxWidth = spaceLeft + 'px';
                arrowHorizontalClass = 'arrow-right';
            }
        }
        
        // Calcul de la position verticale idéale
        if (spaceBottom > tooltipRect.height + 10) {
            // En dessous de l'icône
            tooltip.style.top = '100%';
            tooltip.style.marginTop = '5px';
            tooltip.classList.add('tooltip-bottom');
            tooltip.classList.add(arrowHorizontalClass);
        } else if (spaceTop > tooltipRect.height + 10) {
            // Au-dessus de l'icône
            tooltip.style.bottom = '100%';
            tooltip.style.marginBottom = '5px';
            tooltip.classList.add('tooltip-top');
            tooltip.classList.add(arrowHorizontalClass);
        } else {
            // Pas assez d'espace vertical, positionner à côté
            if (spaceRight > tooltipRect.width + 10) {
                // À droite
                tooltip.style.left = '100%';
                tooltip.style.marginLeft = '5px';
                tooltip.style.top = '0';
                tooltip.classList.add('tooltip-right');
            } else {
                // À gauche
                tooltip.style.right = '100%';
                tooltip.style.marginRight = '5px';
                tooltip.style.top = '0';
                tooltip.classList.add('tooltip-left');
            }
        }
        
        // Vérifier si le tooltip dépasse encore du conteneur parent et ajuster si nécessaire
        const updatedTooltipRect = tooltip.getBoundingClientRect();
        
        if (updatedTooltipRect.left < parentRect.left) {
            tooltip.style.left = '0';
            tooltip.style.right = 'auto';
            
            // Ajuster la position de la flèche
            if (tooltip.classList.contains('tooltip-top') || tooltip.classList.contains('tooltip-bottom')) {
                tooltip.classList.remove('arrow-center', 'arrow-right');
                tooltip.classList.add('arrow-left');
            }
        }
        
        if (updatedTooltipRect.right > parentRect.right) {
            tooltip.style.right = '0';
            tooltip.style.left = 'auto';
            
            // Ajuster la position de la flèche
            if (tooltip.classList.contains('tooltip-top') || tooltip.classList.contains('tooltip-bottom')) {
                tooltip.classList.remove('arrow-center', 'arrow-left');
                tooltip.classList.add('arrow-right');
            }
        }
        
        if (updatedTooltipRect.top < parentRect.top) {
            tooltip.style.top = '0';
            tooltip.style.bottom = 'auto';
            
            // Si le tooltip était censé être au-dessus, le mettre à droite ou à gauche
            if (tooltip.classList.contains('tooltip-top')) {
                tooltip.classList.remove('tooltip-top');
                if (spaceRight > tooltipRect.width + 10) {
                    tooltip.classList.add('tooltip-right');
                    tooltip.style.left = '100%';
                    tooltip.style.marginLeft = '5px';
                } else {
                    tooltip.classList.add('tooltip-left');
                    tooltip.style.right = '100%';
                    tooltip.style.marginRight = '5px';
                }
            }
        }
        
        if (updatedTooltipRect.bottom > parentRect.bottom) {
            tooltip.style.bottom = '0';
            tooltip.style.top = 'auto';
            
            // Si le tooltip était censé être en dessous, le mettre à droite ou à gauche
            if (tooltip.classList.contains('tooltip-bottom')) {
                tooltip.classList.remove('tooltip-bottom');
                if (spaceRight > tooltipRect.width + 10) {
                    tooltip.classList.add('tooltip-right');
                    tooltip.style.left = '100%';
                    tooltip.style.marginLeft = '5px';
                } else {
                    tooltip.classList.add('tooltip-left');
                    tooltip.style.right = '100%';
                    tooltip.style.marginRight = '5px';
                }
            }
        }
    });
}

// Fonction d'initialisation des info-bulles
function initInfoUnitMesureTooltips() {
    document.querySelectorAll('.info_unit_mesure').forEach(icon => {
        // Ajouter un gestionnaire d'événements pour le clic
        icon.addEventListener('click', function(e) {
            e.stopPropagation(); // Empêcher la propagation vers les éléments parents
            
            // Supprimer la classe active de toutes les autres icônes d'info
            document.querySelectorAll('.info_unit_mesure.active').forEach(activeIcon => {
                if (activeIcon !== this) {
                    activeIcon.classList.remove('active');
                }
            });
            
            // Toggle la classe active sur cette icône
            this.classList.toggle('active');
            
            // Positionner le tooltip si l'icône est active
            if (this.classList.contains('active')) {
                setTimeout(positionTooltips, 0);
            }
        });
    });
    
    // Fermer les tooltips lorsqu'on clique ailleurs sur la page
    document.addEventListener('click', function(e) {
        if (!e.target.classList.contains('info_unit_mesure')) {
            document.querySelectorAll('.info_unit_mesure.active').forEach(icon => {
                icon.classList.remove('active');
            });
        }
    });
    
    // Repositionner les tooltips lors du redimensionnement
    window.addEventListener('resize', function() {
        if (document.querySelectorAll('.info_unit_mesure.active').length > 0) {
            positionTooltips();
        }
    });
    
    // Repositionner les tooltips lors du défilement du menu déroulant
    document.querySelectorAll('.custom-dropdown-items').forEach(container => {
        container.addEventListener('scroll', function() {
            if (document.querySelectorAll('.info_unit_mesure.active').length > 0) {
                positionTooltips();
            }
        });
    });
}





/*══════════════════════════════╗
  ⚫ JS PARTIE 8
  ═════════════════════════════╝*/
  
  // Point de Vente / Sales Point
// ----------------------------------------
document.addEventListener('DOMContentLoaded', function() {
    // Initialisation des variables globales
    let currentSalesMode = null;
    let currentRole = null;
    let currentCart = [];
    let pendingOrders = [];
    let deliveryOrders = [];
    let inventoryData = []; // Sera rempli par vos données d'inventaire existantes
    
    // Éléments d'interface
    const modeSelector = document.getElementById('newonInventSelectMode');
    const roleInterfaces = document.querySelectorAll('.newonInventRoleInterface');
    
    // Service pour les effets sonores et vibrations
const ScannerFeedback = {
    // Contexte audio
    audioContext: null,
    
    // Initialiser le contexte audio
    initAudio: function() {
        if (!this.audioContext) {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            this.audioContext = new AudioContext();
        }
        
        // Démarrer le contexte audio s'il est suspendu
        if (this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }
    },
    
    // Jouer un son de scanner
    playSound: function() {
        this.initAudio();
        
        // Durée très courte pour un beep net
        const duration = 0.07;
        
        // Oscillateur principal pour le beep
        const oscillator = this.audioContext.createOscillator();
        
        // Gain pour contrôler le volume et l'enveloppe du son
        const gainNode = this.audioContext.createGain();
        
        // Filtre pour affiner le son
        const filter = this.audioContext.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.value = 2500;
        filter.Q.value = 10;
        
        // Configuration de l'oscillateur
        oscillator.type = 'square';
        oscillator.frequency.setValueAtTime(2500, this.audioContext.currentTime);
        
        // Enveloppe sonore pour un beep net et court
        gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.7, this.audioContext.currentTime + 0.01);
        gainNode.gain.setValueAtTime(0.7, this.audioContext.currentTime + duration - 0.01);
        gainNode.gain.linearRampToValueAtTime(0, this.audioContext.currentTime + duration);
        
        // Connexion des nœuds audio
        oscillator.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        // Démarrage et arrêt de l'oscillateur
        oscillator.start();
        oscillator.stop(this.audioContext.currentTime + duration + 0.01);
    },
    
    // Faire vibrer l'appareil
    vibrate: function() {
        if (navigator.vibrate) {
            // Le pattern [40, 30, 70] signifie:
            // - vibrer 40ms
            // - pause 30ms
            // - vibrer 70ms
            navigator.vibrate([40, 30, 70]);
            return true;
        }
        return false;
    },
    
    // Déclencher le son et la vibration
    feedback: function() {
        this.playSound();
        this.vibrate();
    }
};

// Service pour les sons de la saisie manuelle
const ManualEntryFeedback = {
    // Contexte audio
    audioContext: null,
    
    // Initialiser le contexte audio
    initAudio: function() {
        if (!this.audioContext) {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        }
        
        // Démarrer le contexte audio s'il est suspendu
        if (this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }
    },
    
    // Jouer un son de beep pour la saisie manuelle
    playSound: function() {
        this.initAudio();
        
        // Créer un oscillateur pour générer le son
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        // Configurer l'oscillateur pour un son de scanner typique
        oscillator.type = 'square';
        oscillator.frequency.setValueAtTime(2000, this.audioContext.currentTime); // Fréquence haute
        oscillator.frequency.setValueAtTime(1800, this.audioContext.currentTime + 0.05); // Fréquence légèrement plus basse
        
        // Configurer le volume
        gainNode.gain.setValueAtTime(0.5, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.1);
        
        // Connecter les nœuds audio
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        // Jouer le son
        oscillator.start();
        oscillator.stop(this.audioContext.currentTime + 0.1);
    },
    
    // Faire vibrer l'appareil
    vibrate: function() {
        if (navigator.vibrate) {
            // Vibrer pendant 100ms
            navigator.vibrate(100);
            return true;
        }
        return false;
    },
    
    // Déclencher le son et la vibration
    feedback: function() {
        this.playSound();
        this.vibrate();
    }
};


// Service pour les sons de paiement
const PaymentFeedback = {
    // Contexte audio
    audioContext: null,
    // Buffer du son de caisse
    cashSoundBuffer: null,
    
    // Initialiser le contexte audio et charger le son
    init: function() {
        if (!this.audioContext) {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            this.audioContext = new AudioContext();
            this.loadCashSound();
        }
        
        // Démarrer le contexte audio s'il est suspendu
        if (this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }
    },
    
    // Charger le son de caisse
    loadCashSound: function() {
        // Créer une requête pour charger le fichier audio
        const request = new XMLHttpRequest();
        request.open('GET', 'cash.mp3', true);
        request.responseType = 'arraybuffer';
        
        request.onload = () => {
            // Décoder les données audio
            this.audioContext.decodeAudioData(request.response, (buffer) => {
                this.cashSoundBuffer = buffer;
            }, (error) => {
                console.error('Erreur lors du décodage du fichier audio:', error);
            });
        };
        
        request.onerror = () => {
            console.error('Erreur lors du chargement du fichier audio');
        };
        
        request.send();
    },
    
    // Jouer le son de caisse
    playCashSound: function() {
        if (this.cashSoundBuffer) {
            // Créer une source audio
            const source = this.audioContext.createBufferSource();
            source.buffer = this.cashSoundBuffer;
            
            // Connexion au contexte audio
            source.connect(this.audioContext.destination);
            
            // Jouer le son
            source.start(0);
            return true;
        } else {
            console.warn('Le son de caisse n\'est pas encore chargé');
            return false;
        }
    },
    
    // Faire vibrer l'appareil
    vibrate: function() {
        if (navigator.vibrate) {
            // Le pattern [40, 30, 70] signifie:
            // - vibrer 40ms
            // - pause 30ms
            // - vibrer 70ms
            navigator.vibrate([40, 30, 70]);
            return true;
        }
        return false;
    },
    
    // Déclencher le son et la vibration pour le paiement
    feedback: function() {
        this.playCashSound();
        this.vibrate();
    }
};


    // Chargement des données d'inventaire (pour simuler votre inventaire existant)
    function loadInventoryData() {
        // Cette fonction devrait récupérer les données de votre inventaire
        // Pour l'exemple, nous utiliserons des données fictives
        inventoryData = [
            { id: 'P001', name: 'Smartphone XYZ', price: 250, currency: 'usd', stock: 15 },
            { id: 'P002', name: 'Chargeur USB', price: 15, currency: 'usd', stock: 30 },
            { id: 'P003', name: 'Écouteurs sans fil', price: 45, currency: 'usd', stock: 10 },
            { id: 'P004', name: 'Cable HDMI', price: 8, currency: 'usd', stock: 25 },
            { id: 'P005', name: 'Batterie portable', price: 30, currency: 'usd', stock: 12 }
        ];
    }
    
    // Sélection du mode de vente
    function initModeSelectorCard() {
        const modeCards = document.querySelectorAll('.newonInventModeCard');
        
        modeCards.forEach(card => {
            card.addEventListener('click', function() {
                // Supprime la classe active de toutes les cartes
                modeCards.forEach(c => c.classList.remove('active'));
                
                // Ajoute la classe active à la carte cliquée
                this.classList.add('active');
                
                // Récupère le mode sélectionné
                const mode = this.getAttribute('data-mode');
                
                // Définit le mode de vente actuel
                currentSalesMode = mode;
                
                // Active l'interface appropriée selon le mode
                if (mode === 'oneSeller') {
                    resetAllInterfaces();
                    document.getElementById('newonInventSingleSellerMode').style.display = 'block';
                    modeSelector.style.display = 'none';
                } 
                else if (mode === 'twoSellers' || mode === 'threeSellers') {
                    // Ouvre la modale de sélection de rôle
                    openRoleSelectionModal(mode);
                }
            });
        });
    }
    
    // Ouvre la modale de sélection de rôle
    function openRoleSelectionModal(mode) {
        const roleSelectorContainer = document.getElementById('newonInventRoleSelector');
        roleSelectorContainer.innerHTML = '';
        
        // Crée les options de rôle selon le mode
        if (mode === 'twoSellers') {
            // Options pour le mode deux vendeurs
            roleSelectorContainer.innerHTML = `
                <div class="newonInventRoleOption" data-role="seller1" data-mode="twoSellers">
                    <div class="newonInventRoleIcon"><i class="fas fa-user-check"></i></div>
                    <div class="newonInventRoleInfo">
                        <h6>Vendeur 1 - Réception Client</h6>
                        <p>Accueillir le client, scanner les produits et transférer au caissier</p>
                    </div>
                </div>
                <div class="newonInventRoleOption" data-role="seller2" data-mode="twoSellers">
                    <div class="newonInventRoleIcon"><i class="fas fa-cash-register"></i></div>
                    <div class="newonInventRoleInfo">
                        <h6>Vendeur 2 - Caissier</h6>
                        <p>Recevoir les commandes, encaisser le paiement et apporter les produits</p>
                    </div>
                </div>
            `;
        } else if (mode === 'threeSellers') {
            // Options pour le mode trois vendeurs
            roleSelectorContainer.innerHTML = `
                <div class="newonInventRoleOption" data-role="seller1" data-mode="threeSellers">
                    <div class="newonInventRoleIcon"><i class="fas fa-user-check"></i></div>
                    <div class="newonInventRoleInfo">
                        <h6>Vendeur 1 - Réception Client</h6>
                        <p>Accueillir le client, scanner les produits et transférer au caissier</p>
                    </div>
                </div>
                <div class="newonInventRoleOption" data-role="seller2" data-mode="threeSellers">
                    <div class="newonInventRoleIcon"><i class="fas fa-cash-register"></i></div>
                    <div class="newonInventRoleInfo">
                        <h6>Vendeur 2 - Caissier</h6>
                        <p>Recevoir les commandes et encaisser le paiement</p>
                    </div>
                </div>
                <div class="newonInventRoleOption" data-role="seller3" data-mode="threeSellers">
                    <div class="newonInventRoleIcon"><i class="fas fa-box"></i></div>
                    <div class="newonInventRoleInfo">
                        <h6>Vendeur 3 - Livraison</h6>
                        <p>Apporter les produits au client après paiement confirmé</p>
                    </div>
                </div>
            `;
        }
        
        // Ajoute des écouteurs d'événements aux options de rôle
        const roleOptions = document.querySelectorAll('.newonInventRoleOption');
        roleOptions.forEach(option => {
            option.addEventListener('click', function() {
                roleOptions.forEach(o => o.classList.remove('active'));
                this.classList.add('active');
                
                const role = this.getAttribute('data-role');
                const mode = this.getAttribute('data-mode');
                
                // Sauvegarde le rôle sélectionné
                currentRole = { role, mode };
            });
        });
        
        // Initialise et ouvre la modale
        const roleModal = new bootstrap.Modal(document.getElementById('newonInventRoleModal'));
        roleModal.show();
        
        // Ajoute un écouteur d'événements pour quand la modale est fermée
        document.getElementById('newonInventRoleModal').addEventListener('hidden.bs.modal', function() {
            if (currentRole) {
                // Active l'interface appropriée selon le rôle sélectionné
                activateRoleInterface(currentRole.role, currentRole.mode);
            } else {
                // Si aucun rôle n'a été sélectionné, revenir à la sélection de mode
                resetAllInterfaces();
                const modeCards = document.querySelectorAll('.newonInventModeCard');
                modeCards.forEach(c => c.classList.remove('active'));
                modeSelector.style.display = 'block';
            }
        });
    }
    
    // Active l'interface appropriée selon le rôle
    function activateRoleInterface(role, mode) {
        resetAllInterfaces();
        modeSelector.style.display = 'none';
        
        if (mode === 'twoSellers') {
            if (role === 'seller1') {
                document.getElementById('newonInventTwoSellers_Seller1').style.display = 'block';
            } else if (role === 'seller2') {
                document.getElementById('newonInventTwoSellers_Seller2').style.display = 'block';
            }
        } else if (mode === 'threeSellers') {
            if (role === 'seller1') {
                document.getElementById('newonInventThreeSellers_Seller1').style.display = 'block';
            } else if (role === 'seller2') {
                document.getElementById('newonInventThreeSellers_Seller2').style.display = 'block';
            } else if (role === 'seller3') {
                document.getElementById('newonInventThreeSellers_Seller3').style.display = 'block';
            }
        }
    }
    
    // Réinitialise toutes les interfaces
    function resetAllInterfaces() {
        roleInterfaces.forEach(interface => {
            interface.style.display = 'none';
        });
    }
    
// Initialisation du scanner
function initScanners() {
    const scanButtons = [
        document.getElementById('newonInventScanBtn'),
        document.getElementById('newonInventScanBtn2'),
        document.getElementById('newonInventScanBtn3')
    ];
    
    const cancelScanButtons = [
        document.getElementById('newonInventCancelScan'),
        document.getElementById('newonInventCancelScan2'),
        document.getElementById('newonInventCancelScan3')
    ];
    
    const scannerAreas = [
        document.getElementById('newonInventScannerArea'),
        document.getElementById('newonInventScannerArea2'),
        document.getElementById('newonInventScannerArea3')
    ];
    
    const videoElements = [
        document.getElementById('newonInventScannerVideo'),
        document.getElementById('newonInventScannerVideo2'),
        document.getElementById('newonInventScannerVideo3')
    ];
    
    // Initialisation des éléments pour le scanner moderne
    const toggleModeBtns = [
        document.getElementById('ScanProdVentToggleMode'),
        document.getElementById('ScanProdVentToggleMode2'),
        document.getElementById('ScanProdVentToggleMode3')
    ];
    
    const toggleLightBtns = [
        document.getElementById('ScanProdVentToggleLight'),
        document.getElementById('ScanProdVentToggleLight2'),
        document.getElementById('ScanProdVentToggleLight3')
    ];
    
    const barcodeIcons = [
        document.getElementById('ScanProdVentBarcode'),
        document.getElementById('ScanProdVentBarcode2'),
        document.getElementById('ScanProdVentBarcode3')
    ];
    
    const qrcodeIcons = [
        document.getElementById('ScanProdVentQRCode'),
        document.getElementById('ScanProdVentQRCode2'),
        document.getElementById('ScanProdVentQRCode3')
    ];
    
    const currentModeTexts = [
        document.getElementById('ScanProdVentCurrentMode'),
        document.getElementById('ScanProdVentCurrentMode2'),
        document.getElementById('ScanProdVentCurrentMode3')
    ];
    
    // Stocke les références des tracks de la caméra pour chaque scanner
    let videoTracks = [null, null, null];
    // Stocke l'état de la lampe torche pour chaque scanner
    let torchStates = [false, false, false];
    
    scanButtons.forEach((button, index) => {
        if (button) {
            button.addEventListener('click', function() {
                // Affiche la zone de scan et cache les autres éléments
                scannerAreas[index].style.display = 'block';
                
                // Mettre à jour la hauteur de la zone
                updateScanZoneHeight();
                
                // Initialise le scanner de code-barres/QR code
                initBarcodeScannerPos(videoElements[index], index);
                
                // Active le mode par défaut (barcode)
                if (barcodeIcons[index]) {
                    barcodeIcons[index].classList.add('active');
                    qrcodeIcons[index].classList.remove('active');
                    if (currentModeTexts[index]) {
                        currentModeTexts[index].textContent = 'Code-barres';
                    }
                }
                
                // Animation de démarrage
                setTimeout(() => {
                    const message = document.querySelector('.ScanProdVentMessage');
                    if (message) {
                        message.textContent = 'Scanner prêt';
                        
                        setTimeout(() => {
                            message.textContent = 'Positionnez le code dans le cadre';
                        }, 1500);
                    }
                }, 500);
            });
        }
    });
    
    cancelScanButtons.forEach((button, index) => {
        if (button) {
            button.addEventListener('click', function() {
                // Cache la zone de scan
                scannerAreas[index].style.display = 'none';
                
                // Mettre à jour la hauteur de la zone
                updateScanZoneHeight();
                
                // Arrête le scanner
                stopBarcodeScanner();
                
                // Réinitialise l'état de la lampe torche
                torchStates[index] = false;
                if (toggleLightBtns[index]) {
                    toggleLightBtns[index].classList.remove('active');
                }
            });
        }
    });
    
    // Gestion du changement de mode (code-barres / QR code)
    toggleModeBtns.forEach((button, index) => {
        if (button) {
            button.addEventListener('click', function() {
                if (barcodeIcons[index] && qrcodeIcons[index]) {
                    // Change le mode actif
                    if (barcodeIcons[index].classList.contains('active')) {
                        barcodeIcons[index].classList.remove('active');
                        qrcodeIcons[index].classList.add('active');
                        if (currentModeTexts[index]) {
                            currentModeTexts[index].textContent = 'QR Code';
                        }
                        
                        // Afficher un message de changement
                        const message = document.querySelector('.ScanProdVentMessage');
                        if (message) {
                            message.textContent = 'Mode QR Code activé';
                            
                            setTimeout(() => {
                                message.textContent = 'Positionnez le QR code dans le cadre';
                            }, 1500);
                        }
                    } else {
                        barcodeIcons[index].classList.add('active');
                        qrcodeIcons[index].classList.remove('active');
                        if (currentModeTexts[index]) {
                            currentModeTexts[index].textContent = 'Code-barres';
                        }
                        
                        // Afficher un message de changement
                        const message = document.querySelector('.ScanProdVentMessage');
                        if (message) {
                            message.textContent = 'Mode Code-barres activé';
                            
                            setTimeout(() => {
                                message.textContent = 'Positionnez le code-barres dans le cadre';
                            }, 1500);
                        }
                    }
                }
            });
        }
    });
    
    // Gestion du flash
    toggleLightBtns.forEach((button, index) => {
        if (button) {
            button.addEventListener('click', async function() {
                button.classList.toggle('active');
                torchStates[index] = button.classList.contains('active');
                
                try {
                    // Si le track n'est pas encore défini, on l'obtient
                    if (!videoTracks[index] && videoElements[index] && videoElements[index].srcObject) {
                        videoTracks[index] = videoElements[index].srcObject.getVideoTracks()[0];
                    }
                    
                    if (videoTracks[index]) {
                        // Vérifier si la fonction torch est disponible
                        const capabilities = videoTracks[index].getCapabilities();
                        if ('torch' in capabilities) {
                            // Appliquer le changement de lampe torche
                            await videoTracks[index].applyConstraints({
                                advanced: [{ torch: torchStates[index] }]
                            });
                            
                            // Message flash activé/désactivé
                            const messages = document.querySelectorAll('.ScanProdVentMessage');
                            const message = messages[index] || messages[0];
                            
                            if (message) {
                                message.textContent = torchStates[index] ? 'Flash activé' : 'Flash désactivé';
                                
                                setTimeout(() => {
                                    message.textContent = 'Positionnez le code dans le cadre';
                                }, 1000);
                            }
                        } else {
                            console.warn("La lampe torche n'est pas prise en charge sur cet appareil");
                            // Simuler un changement de luminosité (comme fallback)
                            if (videoElements[index]) {
                                videoElements[index].style.filter = torchStates[index] ? 'brightness(1.3)' : 'brightness(1)';
                            }
                            
                            const messages = document.querySelectorAll('.ScanProdVentMessage');
                            const message = messages[index] || messages[0];
                            
                            if (message) {
                                message.textContent = torchStates[index] ? 
                                    "Simulation de flash (appareil non compatible)" : 
                                    "Flash désactivé";
                                
                                setTimeout(() => {
                                    message.textContent = 'Positionnez le code dans le cadre';
                                }, 1500);
                            }
                        }
                    }
                } catch (error) {
                    console.error("Erreur lors de l'activation de la lampe torche:", error);
                    
                    // Fallback au changement de luminosité
                    if (videoElements[index]) {
                        videoElements[index].style.filter = torchStates[index] ? 'brightness(1.3)' : 'brightness(1)';
                    }
                }
            });
        }
    });
}

    
// Initialisation de la saisie manuelle
function initManualEntry() {
    const manualButtons = [
        document.getElementById('newonInventManualEntryBtn'),
        document.getElementById('newonInventManualEntryBtn2'),
        document.getElementById('newonInventManualEntryBtn3')
    ];
    
    const cancelManualButtons = [
        document.getElementById('newonInventCancelManual'),
        document.getElementById('newonInventCancelManual2'),
        document.getElementById('newonInventCancelManual3')
    ];
    
    const manualEntryAreas = [
        document.getElementById('newonInventManualEntry'),
        document.getElementById('newonInventManualEntry2'),
        document.getElementById('newonInventManualEntry3')
    ];
    
    manualButtons.forEach((button, index) => {
        if (button) {
            button.addEventListener('click', function() {
                // Affiche la zone de saisie manuelle
                manualEntryAreas[index].style.display = 'block';
                
                // Focus sur le champ de recherche
                const searchInput = document.getElementById(`newonInventManualCode${index > 0 ? index : ''}`);
                if (searchInput) {
                    setTimeout(() => {
                        searchInput.focus();
                    }, 100);
                }
            });
        }
    });
    
    cancelManualButtons.forEach((button, index) => {
        if (button) {
            button.addEventListener('click', function() {
                // Cache la zone de saisie manuelle
                manualEntryAreas[index].style.display = 'none';
                
                // Réinitialise le champ de saisie et les résultats
                const searchInput = document.getElementById(`newonInventManualCode${index > 0 ? index : ''}`);
                const resultsList = document.getElementById(`ManualModeSaisie_resultsList${index > 0 ? index : ''}`);
                
                if (searchInput) {
                    searchInput.value = '';
                }
                
                if (resultsList) {
                    resultsList.innerHTML = '';
                }
            });
        }
    });
    
    // Initialiser la recherche produit améliorée
    ManualModeSaisie_initProductSearch();
}

    

let scannerInterval;
let lastDetectionTime = 0; // Pour éviter les détections multiples
const DETECTION_COOLDOWN = 3000; // 3 secondes de cooldown entre chaque détection

function initBarcodeScannerPos(videoElement, interfaceIndex) {
    if (videoElement) {
        // Cette fonction simule la détection d'un code-barres
        // Dans une application réelle, vous utiliseriez une bibliothèque comme QuaggaJS ou ZXing
        
        // Simulons l'accès à la caméra avec options pour caméra arrière et contrôle de la lampe
        navigator.mediaDevices.getUserMedia({ 
            video: { 
                facingMode: 'environment',
                advanced: [{ torch: false }] // La lampe est éteinte par défaut
            } 
        })
        .then(function(stream) {
            videoElement.srcObject = stream;
            videoElement.play();
            
            // Stockons la référence du track vidéo pour l'utiliser avec la lampe torche
            const track = stream.getVideoTracks()[0];
            
            // Mise à jour des références pour les boutons de lampe
            const toggleLightBtns = [
                document.getElementById('ScanProdVentToggleLight'),
                document.getElementById('ScanProdVentToggleLight2'),
                document.getElementById('ScanProdVentToggleLight3')
            ];
            
            if (toggleLightBtns[interfaceIndex]) {
                // Vérifier si la fonction torch est disponible
                const capabilities = track.getCapabilities();
                if (!('torch' in capabilities)) {
                    toggleLightBtns[interfaceIndex].title = "Lampe torche non disponible sur cet appareil";
                } else {
                    toggleLightBtns[interfaceIndex].title = "Activer/désactiver la lampe torche";
                }
            }
            
            // Montrons l'animation de démarrage avec le message
            let scanProdVentMessages = document.querySelectorAll('.ScanProdVentMessage');
            let message = scanProdVentMessages[interfaceIndex] || scanProdVentMessages[0];
            
            if (message) {
                message.textContent = 'Initialisation...';
                
                setTimeout(() => {
                    message.textContent = 'Scanner activé';
                    
                    setTimeout(() => {
                        message.textContent = 'Recherche de codes...';
                        
                        // Mettons en place une détection continue
                        startContinuousScanning(videoElement, interfaceIndex, message);
                        
                    }, 1000);
                }, 1000);
            }
        })
        .catch(function(error) {
            console.error("Impossible d'accéder à la caméra:", error);
            
            // Afficher un message d'erreur stylisé plutôt qu'une alerte
            let scanProdVentMessages = document.querySelectorAll('.ScanProdVentMessage');
            let message = scanProdVentMessages[interfaceIndex] || scanProdVentMessages[0];
            
            if (message) {
                message.textContent = "Erreur: Impossible d'accéder à la caméra";
                message.style.backgroundColor = "rgba(255, 0, 0, 0.7)";
            }
        });
    }
}


function startContinuousScanning(videoElement, interfaceIndex, messageElement) {
    // Simule une détection de code toutes les 5 secondes
    scannerInterval = setInterval(() => {
        const currentTime = Date.now();
        if (currentTime - lastDetectionTime < DETECTION_COOLDOWN) {
            return; // Ne pas détecter si on est dans la période de cooldown
        }
        
        // Vérifier si la vidéo est toujours active (flux de la caméra)
        if (!videoElement.srcObject || videoElement.srcObject.getVideoTracks()[0].readyState !== 'live') {
            clearInterval(scannerInterval);
            return;
        }
        
        // 20% de chance de détecter quelque chose pour simuler un comportement plus naturel
        if (Math.random() < 0.2) {
            // Mise à jour du temps de dernière détection
            lastDetectionTime = currentTime;
            
            // Jeu d'animation pour la détection
            let frames = document.querySelectorAll('.ScanProdVentFrame');
            let frame = frames[interfaceIndex] || frames[0];
            
            if (frame) {
                // Animation de détection
                frame.style.borderColor = 'var(--primary)';
                frame.style.boxShadow = '0 0 20px var(--primary), 0 0 0 5000px rgba(0, 0, 0, 0.7)';
                
                // Message de détection
                if (messageElement) {
                    messageElement.textContent = 'Code détecté !';
                }
                
                // Feedback immédiat lors de la détection
                ScannerFeedback.feedback();
                
                // Simulons la détection d'un code aléatoire
                const randomIndex = Math.floor(Math.random() * inventoryData.length);
                const detectedProduct = inventoryData[randomIndex];
                
                // Ajoutons le produit détecté au panier
                if (detectedProduct) {
                    addProductToCart(detectedProduct, interfaceIndex);
                }
                
                // Réinitialisation de l'interface après détection
                setTimeout(() => {
                    if (frame) {
                        frame.style.borderColor = '';
                        frame.style.boxShadow = '';
                    }
                    
                    if (messageElement) {
                        messageElement.textContent = 'Recherche de codes...';
                    }
                }, 1500);
            }
        }
    }, 1500); // Vérifie toutes les 1.5 secondes si un code est détectable
}




// Fonction à ajouter dans votre code JavaScript pour gérer la hauteur
function updateScanZoneHeight() {
    const scannerAreas = [
        document.getElementById('newonInventScannerArea'),
        document.getElementById('newonInventScannerArea2'),
        document.getElementById('newonInventScannerArea3')
    ];
    
    const scanZones = document.querySelectorAll('.newonInventScanZone');
    
    scannerAreas.forEach((area, index) => {
        if (area) {
            // Ajuster la hauteur de la zone seulement quand le scanner est visible
            if (area.style.display === 'block') {
                if (scanZones[index]) {
                    scanZones[index].classList.add('newonInventScannerArea-active');
                    // Augmenter la hauteur pour l'interface moderne
                    scanZones[index].style.minHeight = '450px';
                }
            } else {
                if (scanZones[index]) {
                    scanZones[index].classList.remove('newonInventScannerArea-active');
                    scanZones[index].style.minHeight = '';
                }
            }
        }
    });
}
    
// Arrête le scanner
function stopBarcodeScanner() {
    clearInterval(scannerInterval);
    
    // Arrêtons tous les flux vidéo et désactivons les lampes torche
    const videos = [
        document.getElementById('newonInventScannerVideo'),
        document.getElementById('newonInventScannerVideo2'),
        document.getElementById('newonInventScannerVideo3')
    ];
    
    const toggleLightBtns = [
        document.getElementById('ScanProdVentToggleLight'),
        document.getElementById('ScanProdVentToggleLight2'),
        document.getElementById('ScanProdVentToggleLight3')
    ];
    
    videos.forEach((video, index) => {
        if (video && video.srcObject) {
            // S'assurer que la lampe est éteinte avant de fermer le stream
            const track = video.srcObject.getVideoTracks()[0];
            if (track) {
                // Tenter d'éteindre la lampe torche si elle est accessible
                try {
                    const capabilities = track.getCapabilities();
                    if ('torch' in capabilities) {
                        track.applyConstraints({
                            advanced: [{ torch: false }]
                        }).catch(err => console.warn("Impossible d'éteindre la lampe torche:", err));
                    }
                } catch (e) {
                    console.warn("Erreur lors de l'extinction de la lampe torche:", e);
                }
            }
            
            // Arrêter tous les tracks
            const tracks = video.srcObject.getTracks();
            tracks.forEach(track => track.stop());
        }
        
        // Réinitialiser l'état visuel du bouton de la lampe
        if (toggleLightBtns[index]) {
            toggleLightBtns[index].classList.remove('active');
        }
    });
    
    // Réinitialisation de tous les éléments d'interface scanner
    const frames = document.querySelectorAll('.ScanProdVentFrame');
    frames.forEach(frame => {
        if (frame) {
            frame.style.borderColor = '';
            frame.style.boxShadow = '';
        }
    });
    
    const messages = document.querySelectorAll('.ScanProdVentMessage');
    messages.forEach(message => {
        if (message) {
            message.textContent = 'Positionnez le code dans le cadre';
            message.style.backgroundColor = '';
        }
    });
    
    // Réinitialiser le style des vidéos (au cas où le fallback de luminosité était utilisé)
    videos.forEach(video => {
        if (video) {
            video.style.filter = 'brightness(1)';
        }
    });
}


    
// Recherche un produit par code et l'ajoute au panier
function findAndAddProduct(code, interfaceIndex) {
    // Recherche le produit dans les données d'inventaire
    const product = inventoryData.find(p => p.id === code);
    
    if (product) {
        // Appel à la fonction addProductToCartManual au lieu de addProductToCart
        addProductToCartManual(product, interfaceIndex);
        
        // Mettre à jour la liste des produits récents
        ManualModeSaisie_updateRecentProducts(product);
        
    } else {
        // Afficher un message d'erreur dans la zone de résultats
        const resultsList = document.getElementById(`ManualModeSaisie_resultsList${interfaceIndex > 0 ? interfaceIndex : ''}`);
        if (resultsList) {
            resultsList.innerHTML = `
                <div class="ManualModeSaisie_noResults">
                    <i class="fas fa-exclamation-circle text-danger"></i>
                    <p>Produit non trouvé. Vérifiez le code.</p>
                </div>
            `;
        } else {
            alert("Produit non trouvé. Vérifiez le code.");
        }
    }
}



    
// Ajoute un produit au panier
function addProductToCart(product, interfaceIndex) {
    // Jouer le son et déclencher la vibration
    ScannerFeedback.feedback();
    
    // Vérifie si l'interface est celle du vendeur unique, du vendeur 1 (mode 2), ou du vendeur 1 (mode 3)
    const cartIndex = interfaceIndex;
    
    // Détermine dans quel panier ajouter le produit
    let cartItems;
    if (cartIndex === 0) {
        cartItems = document.getElementById('newonInventCartItems');
    } else if (cartIndex === 1) {
        cartItems = document.getElementById('newonInventCartItems2');
    } else if (cartIndex === 2) {
        cartItems = document.getElementById('newonInventCartItems3');
    }
    
    if (!cartItems) return;
    
    // Vide l'état "panier vide" s'il existe
    const emptyCart = cartItems.querySelector('.newonInventEmptyCart');
    if (emptyCart) {
        emptyCart.style.display = 'none';
    }
    
    // Vérifie si le produit est déjà dans le panier
    const existingItem = currentCart.find(item => item.id === product.id);
    
    if (existingItem) {
        // Si le produit existe déjà, incrémente sa quantité
        existingItem.quantity += 1;
        
        // Met à jour l'affichage de la quantité
        const quantityInput = document.querySelector(`[data-product-id="${product.id}"] .product-quantity-input`);
        if (quantityInput) {
            quantityInput.value = existingItem.quantity;
        }
    } else {
        // Si le produit n'existe pas encore, ajoute-le au panier
        const newItem = { ...product, quantity: 1 };
        currentCart.push(newItem);
        
        // Crée un élément de panier
        const cartItemElement = document.createElement('div');
        cartItemElement.className = 'newonInventCartItem';
        cartItemElement.setAttribute('data-product-id', product.id);
        
        const displayPrice = product.price.toFixed(2) + (product.currency === 'usd' ? ' $' : ' FC');
        
        cartItemElement.innerHTML = `
            <div class="product-info">
                <div class="product-name">${product.name}</div>
                <button class="remove-item" data-product-id="${product.id}">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="product-controls">
                <div class="product-price">${displayPrice}</div>
                <div class="product-quantity">
                    <div class="newonInventQuantity">
                        <button class="decrement-quantity" data-product-id="${product.id}">-</button>
                        <input type="number" min="1" class="product-quantity-input" value="1" data-product-id="${product.id}">
                        <button class="increment-quantity" data-product-id="${product.id}">+</button>
                    </div>
                </div>
            </div>
        `;
        
        // Ajoute l'élément au panier
        cartItems.appendChild(cartItemElement);
        
        // Ajoute des écouteurs d'événement pour les boutons d'incrémentation/décrémentation
        cartItemElement.querySelector('.increment-quantity').addEventListener('click', function() {
            incrementCartItem(product.id);
        });
        
        cartItemElement.querySelector('.decrement-quantity').addEventListener('click', function() {
            decrementCartItem(product.id);
        });
        
        cartItemElement.querySelector('.remove-item').addEventListener('click', function() {
            removeCartItem(product.id);
        });
        
        cartItemElement.querySelector('.product-quantity-input').addEventListener('change', function(e) {
            updateCartItemQuantity(product.id, parseInt(e.target.value));
        });
    }
    
    // Met à jour le total du panier
    updateCartTotal(cartIndex);
    
    // Active le bouton de finalisation si le panier n'est pas vide
    if (cartIndex === 0) {
        document.getElementById('newonInventCompleteSale').disabled = false;
    } else if (cartIndex === 1) {
        document.getElementById('newonInventTransferOrder').disabled = false;
    } else if (cartIndex === 2) {
        document.getElementById('newonInventTransferOrder3').disabled = false;
    }
    
    // Affiche une notification de succès similaire à showNotification
    const notificationCenter = document.getElementById('notification-center');
    if (!notificationCenter) {
        // Si notification-center n'existe pas, on le crée
        const newNotificationCenter = document.createElement('div');
        newNotificationCenter.id = 'notification-center';
        document.body.appendChild(newNotificationCenter);
    }
    
    const message = `"${product.name}" ajouté au panier`;
    const notification = document.createElement('div');
    notification.className = 'notification notification-success';
    notification.innerHTML = `
        <div class="notification-header">
            <div class="notification-title">Succès</div>
            <div class="notification-close"><i class="fas fa-times"></i></div>
        </div>
        <div class="notification-message">${message}</div>
    `;
    
    document.getElementById('notification-center').appendChild(notification);
    
    // Fermeture automatique après 5 secondes
    setTimeout(() => {
        notification.style.opacity = '0';
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 5000);
    
    // Fermeture manuelle
    notification.querySelector('.notification-close').addEventListener('click', () => {
        notification.style.opacity = '0';
        setTimeout(() => {
            notification.remove();
        }, 300);
    });
}

// Ajoute un produit au panier (version pour la méthode manuelle)
function addProductToCartManual(product, interfaceIndex) {
    // Jouer le son et déclencher la vibration spécifiques à la méthode manuelle
    ManualEntryFeedback.feedback();
    
    // Vérifie si l'interface est celle du vendeur unique, du vendeur 1 (mode 2), ou du vendeur 1 (mode 3)
    const cartIndex = interfaceIndex;
    
    // Détermine dans quel panier ajouter le produit
    let cartItems;
    if (cartIndex === 0) {
        cartItems = document.getElementById('newonInventCartItems');
    } else if (cartIndex === 1) {
        cartItems = document.getElementById('newonInventCartItems2');
    } else if (cartIndex === 2) {
        cartItems = document.getElementById('newonInventCartItems3');
    }
    
    if (!cartItems) return;
    
    // Vide l'état "panier vide" s'il existe
    const emptyCart = cartItems.querySelector('.newonInventEmptyCart');
    if (emptyCart) {
        emptyCart.style.display = 'none';
    }
    
    // Vérifie si le produit est déjà dans le panier
    const existingItem = currentCart.find(item => item.id === product.id);
    
    if (existingItem) {
        // Si le produit existe déjà, incrémente sa quantité
        existingItem.quantity += 1;
        
        // Met à jour l'affichage de la quantité
        const quantityInput = document.querySelector(`[data-product-id="${product.id}"] .product-quantity-input`);
        if (quantityInput) {
            quantityInput.value = existingItem.quantity;
        }
    } else {
        // Si le produit n'existe pas encore, ajoute-le au panier
        const newItem = { ...product, quantity: 1 };
        currentCart.push(newItem);
        
        // Crée un élément de panier
        const cartItemElement = document.createElement('div');
        cartItemElement.className = 'newonInventCartItem';
        cartItemElement.setAttribute('data-product-id', product.id);
        
        const displayPrice = product.price.toFixed(2) + (product.currency === 'usd' ? ' $' : ' FC');
        
        cartItemElement.innerHTML = `
            <div class="product-info">
                <div class="product-name">${product.name}</div>
                <button class="remove-item" data-product-id="${product.id}">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="product-controls">
                <div class="product-price">${displayPrice}</div>
                <div class="product-quantity">
                    <div class="newonInventQuantity">
                        <button class="decrement-quantity" data-product-id="${product.id}">-</button>
                        <input type="number" min="1" class="product-quantity-input" value="1" data-product-id="${product.id}">
                        <button class="increment-quantity" data-product-id="${product.id}">+</button>
                    </div>
                </div>
            </div>
        `;
        
        // Ajoute l'élément au panier
        cartItems.appendChild(cartItemElement);
        
        // Ajoute des écouteurs d'événement pour les boutons d'incrémentation/décrémentation
        cartItemElement.querySelector('.increment-quantity').addEventListener('click', function() {
            incrementCartItem(product.id);
        });
        
        cartItemElement.querySelector('.decrement-quantity').addEventListener('click', function() {
            decrementCartItem(product.id);
        });
        
        cartItemElement.querySelector('.remove-item').addEventListener('click', function() {
            removeCartItem(product.id);
        });
        
        cartItemElement.querySelector('.product-quantity-input').addEventListener('change', function(e) {
            updateCartItemQuantity(product.id, parseInt(e.target.value));
        });
    }
    
    // Met à jour le total du panier
    updateCartTotal(cartIndex);
    
    // Active le bouton de finalisation si le panier n'est pas vide
    if (cartIndex === 0) {
        document.getElementById('newonInventCompleteSale').disabled = false;
    } else if (cartIndex === 1) {
        document.getElementById('newonInventTransferOrder').disabled = false;
    } else if (cartIndex === 2) {
        document.getElementById('newonInventTransferOrder3').disabled = false;
    }
    
    // Affiche une notification de succès similaire à showNotification
    const notificationCenter = document.getElementById('notification-center');
    if (!notificationCenter) {
        // Si notification-center n'existe pas, on le crée
        const newNotificationCenter = document.createElement('div');
        newNotificationCenter.id = 'notification-center';
        document.body.appendChild(newNotificationCenter);
    }
    
    const message = `"${product.name}" ajouté au panier`;
    const notification = document.createElement('div');
    notification.className = 'notification notification-success';
    notification.innerHTML = `
        <div class="notification-header">
            <div class="notification-title">Succès</div>
            <div class="notification-close"><i class="fas fa-times"></i></div>
        </div>
        <div class="notification-message">${message}</div>
    `;
    
    document.getElementById('notification-center').appendChild(notification);
    
    // Fermeture automatique après 5 secondes
    setTimeout(() => {
        notification.style.opacity = '0';
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 5000);
    
    // Fermeture manuelle
    notification.querySelector('.notification-close').addEventListener('click', () => {
        notification.style.opacity = '0';
        setTimeout(() => {
            notification.remove();
        }, 300);
    });
}

    
    // Incrémente la quantité d'un produit dans le panier
    function incrementCartItem(productId) {
        const item = currentCart.find(item => item.id === productId);
        if (item) {
            item.quantity += 1;
            
            // Met à jour l'affichage
            const quantityInput = document.querySelector(`[data-product-id="${productId}"] .product-quantity-input`);
            if (quantityInput) {
                quantityInput.value = item.quantity;
            }
            
            updateCartTotal();
        }
    }
    
    // Décrémente la quantité d'un produit dans le panier
    function decrementCartItem(productId) {
        const item = currentCart.find(item => item.id === productId);
        if (item && item.quantity > 1) {
            item.quantity -= 1;
            
            // Met à jour l'affichage
            const quantityInput = document.querySelector(`[data-product-id="${productId}"] .product-quantity-input`);
            if (quantityInput) {
                quantityInput.value = item.quantity;
            }
            
            updateCartTotal();
        } else if (item && item.quantity === 1) {
            removeCartItem(productId);
        }
    }
    
    // Supprime un produit du panier
    function removeCartItem(productId) {
        // Supprime le produit du panier
        currentCart = currentCart.filter(item => item.id !== productId);
        
        // Supprime l'élément du DOM
        const cartItemElement = document.querySelector(`[data-product-id="${productId}"].newonInventCartItem`);
        if (cartItemElement) {
            cartItemElement.remove();
        }
        
        // Vérifie si le panier est vide
        checkEmptyCart();
        
        // Met à jour le total
        updateCartTotal();
    }
    
    // Met à jour la quantité d'un produit dans le panier
    function updateCartItemQuantity(productId, quantity) {
        const item = currentCart.find(item => item.id === productId);
        if (item) {
            item.quantity = Math.max(1, quantity);
            
            updateCartTotal();
        }
    }
    
    // Vérifie si le panier est vide
    function checkEmptyCart() {
        const cartItems = [
            document.getElementById('newonInventCartItems'),
            document.getElementById('newonInventCartItems2'),
            document.getElementById('newonInventCartItems3')
        ];
        
        cartItems.forEach((container, index) => {
            if (container) {
                // Si le panier est vide, affiche un message
                if (!container.querySelector('.newonInventCartItem')) {
                    // Vérifier si le message existe déjà
                    let emptyCart = container.querySelector('.newonInventEmptyCart');
                    
                    if (!emptyCart) {
                        // Créer le message s'il n'existe pas
                        emptyCart = document.createElement('div');
                        emptyCart.className = 'newonInventEmptyCart';
                        emptyCart.innerHTML = `
                            <i class="fas fa-shopping-basket"></i>
                            <p>Le panier est vide</p>
                            <p class="newonInventHelpText">Scannez ou saisissez un produit pour l'ajouter</p>
                        `;
                        container.appendChild(emptyCart);
                    } else {
                        emptyCart.style.display = 'flex';
                    }
                    
                    // Désactive le bouton de finalisation
                    if (index === 0) {
                        document.getElementById('newonInventCompleteSale').disabled = true;
                    } else if (index === 1) {
                        document.getElementById('newonInventTransferOrder').disabled = true;
                    } else if (index === 2) {
                        document.getElementById('newonInventTransferOrder3').disabled = true;
                    }
                }
            }
        });
    }
    
    // Met à jour le total du panier
    function updateCartTotal(interfaceIndex = 0) {
        // Calcule le total
        const total = currentCart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        
        // Détermine quel élément du total mettre à jour
        let totalDisplay, currencyDisplay;
        if (interfaceIndex === 0) {
            totalDisplay = document.getElementById('newonInventTotalAmount');
            currencyDisplay = document.getElementById('newonInventTotalCurrency');
        } else if (interfaceIndex === 1) {
            totalDisplay = document.getElementById('newonInventTotalAmount2');
            currencyDisplay = document.getElementById('newonInventTotalCurrency2');
        } else if (interfaceIndex === 2) {
            totalDisplay = document.getElementById('newonInventTotalAmount3');
            currencyDisplay = document.getElementById('newonInventTotalCurrency3');
        }
        
        // Met à jour l'affichage du total
        if (totalDisplay) {
            totalDisplay.textContent = total.toFixed(2);
        }
        
        // Met à jour l'affichage de la devise
        if (currencyDisplay) {
            const mainCurrency = currentCart.length > 0 ? currentCart[0].currency.toUpperCase() : 'USD';
            currencyDisplay.textContent = mainCurrency;
        }
    }
    
// Initialise les écouteurs d'événements pour le point de vente
function initSalesEventListeners() {
    // Bouton de changement de rôle
    const roleToggleBtn = document.getElementById('newonInventRoleToggle');
    if (roleToggleBtn) {
        roleToggleBtn.addEventListener('click', function() {
            if (currentSalesMode) {
                openRoleSelectionModal(currentSalesMode);
            }
        });
    }
    
    // Bouton de réinitialisation du panier
    const resetButtons = [
        document.getElementById('newonInventResetCart'),
        document.getElementById('newonInventResetCart2'),
        document.getElementById('newonInventResetCart3')
    ];
    
    resetButtons.forEach(button => {
        if (button) {
            button.addEventListener('click', function() {
                resetCart();
            });
        }
    });
    
// Boutons de paiement
const paymentButtons = [
    document.getElementById('newonInventCashPayment'),
    document.getElementById('newonInventOtherPayment'),
    document.getElementById('newonInventProcessCash'),
    document.getElementById('newonInventProcessOther'),
    document.getElementById('newonInventProcessCash3'),
    document.getElementById('newonInventProcessOther3')
];

paymentButtons.forEach(button => {
    if (button) {
        button.addEventListener('click', function() {
            // Détermine le groupe de boutons parent
            const parentGroup = this.closest('.newonInventPaymentGrid') || this.closest('.newonInventPaymentOptions');
            
            // Retire la classe active de tous les boutons du même groupe
            if (parentGroup) {
                parentGroup.querySelectorAll('.newonInventPayBtn').forEach(btn => {
                    btn.classList.remove('active');
                });
            }
            
            // Ajoute la classe active au bouton cliqué
            this.classList.add('active');
            
            // Active le bouton de validation approprié
            if (this.id === 'newonInventCashPayment' || this.id === 'newonInventOtherPayment') {
                document.getElementById('newonInventCompleteSale').disabled = false;
            } else if (this.id === 'newonInventProcessCash' || this.id === 'newonInventProcessOther') {
                document.getElementById('newonInventConfirmPayment').disabled = false;
            } else if (this.id === 'newonInventProcessCash3' || this.id === 'newonInventProcessOther3') {
                document.getElementById('newonInventConfirmPayment3').disabled = false;
            }
            
            // Si c'est un paiement en espèces, ouvre la modale
            if (this.id.includes('Cash')) {
                openPaymentModal();
            }
        });
    }
});

// Écouteurs pour les boutons de confirmation de paiement
const confirmPaymentButtons = [
    document.getElementById('newonInventConfirmPayment'),
    document.getElementById('newonInventConfirmPayment3')
];

confirmPaymentButtons.forEach(button => {
    if (button) {
        button.addEventListener('click', function() {
            // Vérifie si un mode de paiement est sélectionné
            const cashBtn = button.id === 'newonInventConfirmPayment' 
                ? document.getElementById('newonInventProcessCash')
                : document.getElementById('newonInventProcessCash3');
                
            const otherBtn = button.id === 'newonInventConfirmPayment' 
                ? document.getElementById('newonInventProcessOther')
                : document.getElementById('newonInventProcessOther3');
            
            if ((cashBtn && cashBtn.classList.contains('active')) || 
                (otherBtn && otherBtn.classList.contains('active'))) {
                
                // Si paiement en espèces, ouvre la modale de paiement
                if (cashBtn && cashBtn.classList.contains('active')) {
                    openPaymentModal();
                } else {
                    // Pour les autres méthodes, confirme directement le paiement
                    confirmPayment({
                        amount: 0,
                        change: 0,
                        currency: 'usd',
                        method: 'other'
                    });
                }
            } else {
                alert("Veuillez sélectionner un mode de paiement.");
            }
        });
    }
});

    
    // Bouton de finalisation de la vente (mode vendeur unique)
    const completeSaleBtn = document.getElementById('newonInventCompleteSale');
    if (completeSaleBtn) {
        completeSaleBtn.addEventListener('click', function() {
            // Vérifier si un mode de paiement est sélectionné
            const cashBtn = document.getElementById('newonInventCashPayment');
            const otherBtn = document.getElementById('newonInventOtherPayment');
            
            if ((cashBtn && cashBtn.classList.contains('active')) || 
                (otherBtn && otherBtn.classList.contains('active'))) {
                // Finaliser la vente
                processSale();
            } else {
                alert("Veuillez sélectionner un mode de paiement.");
            }
        });
    }
    
    // Bouton de transfert de commande (mode 2 et 3, vendeur 1)
    const transferButtons = [
        document.getElementById('newonInventTransferOrder'),
        document.getElementById('newonInventTransferOrder3')
    ];
    
    transferButtons.forEach(button => {
        if (button) {
            button.addEventListener('click', function() {
                // Vérifie si un caissier est sélectionné
                const selectedCashier = document.querySelector('.newonInventCashierCard.active');
                
                if (selectedCashier) {
                    // Transfère la commande au caissier
                    transferOrderToCashier(selectedCashier.getAttribute('data-cashier-id'));
                } else {
                    alert("Veuillez sélectionner un caissier pour le transfert.");
                }
            });
        }
    });
    
    // Initialisation de la sélection des caissiers
    initCashierSelection();
    
    // Initialisation de la sélection des livreurs
    initDeliverySelection();
}

    
    // Initialise la sélection des caissiers
    function initCashierSelection() {
        // Simulation de caissiers disponibles
        const cashiers = [
            { id: 'C001', name: 'Caissier 1', pendingOrders: 0 },
            { id: 'C002', name: 'Caissier 2', pendingOrders: 2 },
            { id: 'C003', name: 'Caissier 3', pendingOrders: 1 }
        ];
        
        // Trie les caissiers par nombre de commandes en attente
        cashiers.sort((a, b) => a.pendingOrders - b.pendingOrders);
        
        // Crée les éléments pour les caissiers
        const cashierContainers = [
            document.getElementById('newonInventCashierOptions'),
            document.getElementById('newonInventCashierOptions3')
        ];
        
        cashierContainers.forEach(container => {
            if (container) {
                container.innerHTML = '';
                
                cashiers.forEach(cashier => {
                    const cashierCard = document.createElement('div');
                    cashierCard.className = 'newonInventCashierCard';
                    cashierCard.setAttribute('data-cashier-id', cashier.id);
                    
                    cashierCard.innerHTML = `
                        <div class="newonInventCashierIcon">
                            <i class="fas fa-user"></i>
                        </div>
                        <div class="newonInventCashierInfo">
                            <h6>${cashier.name}</h6>
                            <span class="newonInventCashierLoad">${cashier.pendingOrders} client${cashier.pendingOrders !== 1 ? 's' : ''} en attente</span>
                        </div>
                    `;
                    
                    container.appendChild(cashierCard);
                    
                    // Ajoute un écouteur d'événement pour la sélection du caissier
                    cashierCard.addEventListener('click', function() {
                        // Retire la classe active de tous les caissiers
                        container.querySelectorAll('.newonInventCashierCard').forEach(card => {
                            card.classList.remove('active');
                        });
                        
                        // Ajoute la classe active au caissier sélectionné
                        cashierCard.classList.add('active');
                    });
                });
            }
        });
    }
    
    // Initialise la sélection des livreurs
function initDeliverySelection() {
    // Simulation de livreurs disponibles
    const deliveryStaff = [
        { id: 'D001', name: 'Livreur 1', pendingOrders: 0 },
        { id: 'D002', name: 'Livreur 2', pendingOrders: 1 },
        { id: 'D003', name: 'Livreur 3', pendingOrders: 0 }
    ];
    
    // Trie les livreurs par nombre de commandes en attente
    deliveryStaff.sort((a, b) => a.pendingOrders - b.pendingOrders);
    
    // Crée les éléments pour les livreurs
    const deliveryContainer = document.getElementById('newonInventDeliveryOptions3');
    
    if (deliveryContainer) {
        deliveryContainer.innerHTML = '';
        
        deliveryStaff.forEach(staff => {
            const deliveryCard = document.createElement('div');
            deliveryCard.className = 'newonInventCashierCard'; // Réutilisation de la classe existante
            deliveryCard.setAttribute('data-delivery-id', staff.id);
            
            deliveryCard.innerHTML = `
                <div class="newonInventCashierIcon">
                    <i class="fas fa-truck"></i>
                </div>
                <div class="newonInventCashierInfo">
                    <h6>${staff.name}</h6>
                    <span class="newonInventCashierLoad">${staff.pendingOrders} commande${staff.pendingOrders !== 1 ? 's' : ''} en attente</span>
                </div>
            `;
            
            deliveryContainer.appendChild(deliveryCard);
            
            // Ajoute un écouteur d'événement pour la sélection du livreur
            deliveryCard.addEventListener('click', function() {
                // Retire la classe active de tous les livreurs
                deliveryContainer.querySelectorAll('.newonInventCashierCard').forEach(card => {
                    card.classList.remove('active');
                });
                
                // Ajoute la classe active au livreur sélectionné
                deliveryCard.classList.add('active');
            });
        });
    }
}

    
// Ouvre la modale de paiement
function openPaymentModal() {
    // Détermine si nous sommes en mode caissier et récupère l'ID de commande
    let total = 0;
    let orderItems = [];
    let orderId = null;
    
    if (currentRole && (currentRole.role === 'seller2' || currentRole.role === 'cashier')) {
        // Mode caissier - récupère les détails de la commande en cours
        const processOrderElement = currentRole.mode === 'twoSellers' 
            ? document.getElementById('newonInventProcessOrder')
            : document.getElementById('newonInventProcessOrder3');
            
        if (processOrderElement && processOrderElement.style.display !== 'none') {
            orderId = processOrderElement.querySelector('.newonInventOrderCard')?.getAttribute('data-order-id');
            
            if (orderId) {
                const order = pendingOrders.find(o => o.id === orderId);
                if (order) {
                    orderItems = order.items;
                    total = orderItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
                }
            }
        }
    } else {
        // Mode vendeur unique - utilise le panier courant
        orderItems = currentCart;
        total = orderItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    }
    
    // Met à jour le total dans la modale
    document.getElementById('newonInventModalTotal').textContent = total.toFixed(2) + ' USD';
    
    // Réinitialise le champ du montant reçu
    document.getElementById('newonInventPaymentAmount').value = '';
    
    // Cache la zone de la monnaie à rendre
    document.getElementById('newonInventChangeContainer').style.display = 'none';
    
    // Initialise et ouvre la modale
    const paymentModal = new bootstrap.Modal(document.getElementById('newonInventPaymentModal'));
    paymentModal.show();
    
    // Supprime les anciens écouteurs d'événements pour éviter les doublons
    const paymentAmountInput = document.getElementById('newonInventPaymentAmount');
    const newPaymentAmountInput = paymentAmountInput.cloneNode(true);
    paymentAmountInput.parentNode.replaceChild(newPaymentAmountInput, paymentAmountInput);
    
    // Ajoute un écouteur d'événement pour calculer la monnaie à rendre
    newPaymentAmountInput.addEventListener('input', function() {
        const amountReceived = parseFloat(this.value) || 0;
        
        if (amountReceived >= total) {
            const change = amountReceived - total;
            
            document.getElementById('newonInventChangeContainer').style.display = 'block';
            document.getElementById('newonInventChangeAmount').textContent = change.toFixed(2) + ' USD';
        } else {
            document.getElementById('newonInventChangeContainer').style.display = 'none';
        }
    });
    
    // Supprime les anciens écouteurs pour le bouton de confirmation
    const confirmBtn = document.getElementById('newonInventConfirmModalPayment');
    const newConfirmBtn = confirmBtn.cloneNode(true);
    confirmBtn.parentNode.replaceChild(newConfirmBtn, confirmBtn);
    
    // Ajoute un écouteur d'événement pour la confirmation du paiement
    newConfirmBtn.addEventListener('click', function() {
        const amountReceived = parseFloat(document.getElementById('newonInventPaymentAmount').value) || 0;
        
        if (amountReceived >= total) {
            // Jouer le son de caisse et faire vibrer l'appareil
            PaymentFeedback.feedback();
            
            // Animation visuelle pour confirmer l'action
            newConfirmBtn.style.backgroundColor = '#2E7D32';
            setTimeout(() => {
                newConfirmBtn.style.backgroundColor = '';
            }, 300);
            
            // Ferme la modale après un court délai pour que le son puisse être entendu
            setTimeout(() => {
                bootstrap.Modal.getInstance(document.getElementById('newonInventPaymentModal')).hide();
                
                // Finalise la vente avec les informations de paiement
                const paymentInfo = {
                    amount: amountReceived,
                    change: amountReceived - total,
                    currency: document.getElementById('newonInventPaymentCurrency').value,
                    method: 'cash'
                };
                
                if (currentRole === null || currentRole.role === 'seller1') {
                    // Mode vendeur unique
                    processSale(paymentInfo);
                } else if (currentRole.role === 'seller2' || currentRole.role === 'cashier') {
                    // Mode caissier
                    confirmPayment(paymentInfo);
                }
            }, 300);
        } else {
            alert("Le montant reçu doit être supérieur ou égal au montant total.");
        }
    });
}


    
    // Finalise la vente (mode vendeur unique)
    function processSale(paymentInfo = null) {
        // Récupère le nom du client
        const clientName = document.getElementById('newonInventClientName').value || 'Client';
        
        // Crée le reçu
        generateReceipt(clientName, currentCart, paymentInfo);
        
        // Ouvre la modale du reçu
        const receiptModal = new bootstrap.Modal(document.getElementById('newonInventReceiptModal'));
        receiptModal.show();
        
        // Après l'affichage du reçu, réinitialise le panier
        document.getElementById('newonInventReceiptModal').addEventListener('hidden.bs.modal', function() {
            resetCart();
        });
    }
    
// Transfère la commande au caissier
function transferOrderToCashier(cashierId) {
    // Récupère le nom du client
    const clientInputId = currentRole.mode === 'twoSellers' ? 'newonInventClientName2' : 'newonInventClientName3';
    const clientName = document.getElementById(clientInputId).value || 'Client';
    
    // Vérifie si le panier n'est pas vide
    if (currentCart.length === 0) {
        alert("Le panier est vide. Impossible de transférer la commande.");
        return;
    }
    
    // Crée un nouvel objet pour la commande
    const newOrder = {
        id: 'O' + Date.now(),
        clientName: clientName,
        items: [...currentCart],
        timestamp: new Date(),
        status: 'pending',
        cashierId: cashierId,
        fromMode: currentRole.mode // Ajoute l'information sur le mode utilisé
    };
    
    // Ajoute la commande à la liste des commandes en attente
    pendingOrders.push(newOrder);
    
    // Affiche un message de confirmation
    alert(`Commande de ${clientName} transférée avec succès au caissier.`);
    
    // Réinitialise le panier et le nom du client
    resetCart();
    document.getElementById(clientInputId).value = '';
    
    // Désélectionne le caissier
    const cashierContainers = [
        document.getElementById('newonInventCashierOptions'),
        document.getElementById('newonInventCashierOptions3')
    ];
    
    cashierContainers.forEach(container => {
        if (container) {
            container.querySelectorAll('.newonInventCashierCard').forEach(card => {
                card.classList.remove('active');
            });
        }
    });
    
    // Mise à jour de l'interface du caissier (si le caissier est déjà connecté)
    updatePendingOrdersList();
}

    
// Confirmez le paiement (mode caissier)
function confirmPayment(paymentInfo = null) {
    // Détermine le mode actuel
    const mode = currentRole.mode;
    
    // Détermine la zone de traitement et les éléments associés
    let processOrderElement, confirmBtn;
    if (mode === 'twoSellers') {
        processOrderElement = document.getElementById('newonInventProcessOrder');
        confirmBtn = document.getElementById('newonInventConfirmPayment');
    } else {
        processOrderElement = document.getElementById('newonInventProcessOrder3');
        confirmBtn = document.getElementById('newonInventConfirmPayment3');
    }
    
    // Récupère l'ID de la commande en cours
    const orderId = processOrderElement.querySelector('.newonInventOrderCard')?.getAttribute('data-order-id');
    
    if (orderId) {
        // Trouve la commande
        const order = pendingOrders.find(o => o.id === orderId);
        
        if (order) {
            // Met à jour le statut de la commande
            order.status = 'paid';
            order.paymentInfo = paymentInfo;
            
            // Si mode 2 vendeurs, la commande est terminée
            if (mode === 'twoSellers') {
                // Génère le reçu
                generateReceipt(order.clientName, order.items, paymentInfo);
                
                // Ouvre la modale du reçu
                const receiptModal = new bootstrap.Modal(document.getElementById('newonInventReceiptModal'));
                receiptModal.show();
                
                // Supprime la commande des commandes en attente
                pendingOrders = pendingOrders.filter(o => o.id !== orderId);
                
                // Cache la zone de traitement
                processOrderElement.style.display = 'none';
                
                // Réaffiche la liste des commandes en attente
                updatePendingOrdersList();
            } 
            // Si mode 3 vendeurs, vérifie la sélection du livreur
            else if (mode === 'threeSellers') {
                // Vérifie si un livreur est sélectionné
                const selectedDelivery = document.querySelector('#newonInventDeliveryOptions3 .newonInventCashierCard.active');
                
                if (selectedDelivery) {
                    // Ajoute l'ID du livreur à la commande
                    order.deliveryId = selectedDelivery.getAttribute('data-delivery-id');
                    order.deliveryName = selectedDelivery.querySelector('h6').textContent;
                    
                    // Génère le reçu
                    generateReceipt(order.clientName, order.items, paymentInfo);
                    
                    // Ouvre la modale du reçu
                    const receiptModal = new bootstrap.Modal(document.getElementById('newonInventReceiptModal'));
                    receiptModal.show();
                    
                    // Transfère la commande au livreur
                    deliveryOrders.push(order);
                    pendingOrders = pendingOrders.filter(o => o.id !== orderId);
                    
                    // Cache la zone de traitement
                    processOrderElement.style.display = 'none';
                    
                    // Réaffiche la liste des commandes
                    updatePendingOrdersList();
                    
                    // Désélectionne le livreur
                    document.querySelectorAll('#newonInventDeliveryOptions3 .newonInventCashierCard').forEach(card => {
                        card.classList.remove('active');
                    });
                    
                    alert(`Commande payée et transférée au livreur ${order.deliveryName}.`);
                } else {
                    alert("Veuillez sélectionner un livreur avant de confirmer le paiement.");
                    return; // Arrête l'exécution si aucun livreur n'est sélectionné
                }
            }
        }
    }
}


    
    // Réinitialise le panier
    function resetCart() {
        // Vide le panier
        currentCart = [];
        
        // Vide les éléments du panier dans le DOM
        const cartContainers = [
            document.getElementById('newonInventCartItems'),
            document.getElementById('newonInventCartItems2'),
            document.getElementById('newonInventCartItems3')
        ];
        
        cartContainers.forEach(container => {
            if (container) {
                container.innerHTML = '';
                
                // Ajoute le message de panier vide
                const emptyCart = document.createElement('div');
                emptyCart.className = 'newonInventEmptyCart';
                emptyCart.innerHTML = `
                    <i class="fas fa-shopping-basket"></i>
                    <p>Le panier est vide</p>
                    <p class="newonInventHelpText">Scannez ou saisissez un produit pour l'ajouter</p>
                `;
                container.appendChild(emptyCart);
            }
        });
        
        // Réinitialise les totaux
        const totals = [
            document.getElementById('newonInventTotalAmount'),
            document.getElementById('newonInventTotalAmount2'),
            document.getElementById('newonInventTotalAmount3')
        ];
        
        totals.forEach(total => {
            if (total) {
                total.textContent = '0.00';
            }
        });
        
        // Désactive les boutons de finalisation
        const completeButtons = [
            document.getElementById('newonInventCompleteSale'),
            document.getElementById('newonInventTransferOrder'),
            document.getElementById('newonInventTransferOrder3')
        ];
        
        completeButtons.forEach(button => {
            if (button) {
                button.disabled = true;
            }
        });
        
        // Réinitialise les boutons de paiement
        const paymentButtons = document.querySelectorAll('.newonInventPayBtn');
        paymentButtons.forEach(button => {
            button.classList.remove('active');
        });
    }
    
    // Génère un reçu de vente
    function generateReceipt(clientName, items, paymentInfo = null) {
        const receiptContent = document.getElementById('newonInventReceiptContent');
        
        // Calcule le total
        const total = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        
        // Crée le contenu du reçu
        receiptContent.innerHTML = `
            <div class="newonInventReceiptHeader">
                <div class="newonInventReceiptLogo">TOTAL</div>
                <p>Gestion d'Inventaire</p>
            </div>
            
            <div class="newonInventReceiptInfo">
                <p><strong>Client:</strong> ${clientName}</p>
                <p><strong>Date:</strong> ${new Date().toLocaleString()}</p>
                <p><strong>N° de reçu:</strong> R${Date.now()}</p>
            </div>
            
            <div class="newonInventReceiptItems">
                ${items.map(item => `
                    <div class="newonInventReceiptItem">
                        <div class="newonInventReceiptItemName">${item.name}</div>
                        <div class="newonInventReceiptItemQty">x${item.quantity}</div>
                        <div class="newonInventReceiptItemPrice">${(item.price * item.quantity).toFixed(2)} ${item.currency.toUpperCase()}</div>
                    </div>
                `).join('')}
            </div>
            
            <div class="newonInventReceiptTotal">
                <span>TOTAL</span>
                <span>${total.toFixed(2)} USD</span>
            </div>
            
            ${paymentInfo ? `
                <div class="newonInventReceiptPayment">
                    <div class="newonInventReceiptItem">
                        <div class="newonInventReceiptItemName">Montant reçu</div>
                        <div class="newonInventReceiptItemQty"></div>
                        <div class="newonInventReceiptItemPrice">${paymentInfo.amount.toFixed(2)} ${paymentInfo.currency.toUpperCase()}</div>
                    </div>
                    <div class="newonInventReceiptItem">
                        <div class="newonInventReceiptItemName">Monnaie rendue</div>
                        <div class="newonInventReceiptItemQty"></div>
                        <div class="newonInventReceiptItemPrice">${paymentInfo.change.toFixed(2)} ${paymentInfo.currency.toUpperCase()}</div>
                    </div>
                </div>
            ` : ''}
            
            <div class="newonInventReceiptFooter">
                <p>Merci pour votre achat!</p>
                <p>Service client: +243 XXX XXX XXX</p>
            </div>
        `;
    }
    
// Met à jour la liste des commandes en attente
function updatePendingOrdersList() {
    // Met à jour la liste des commandes pour les caissiers (Mode 2)
    const orderQueueElement = document.getElementById('newonInventOrderQueue');
    if (orderQueueElement) {
        orderQueueElement.innerHTML = '';
        
        // Filtre les commandes pour ce caissier dans le mode 2
        const mode2Orders = pendingOrders.filter(order => order.fromMode === 'twoSellers');
        
        if (mode2Orders.length === 0) {
            orderQueueElement.innerHTML = `
                <div class="newonInventEmptyState">
                    <i class="fas fa-clipboard-check"></i>
                    <p>Aucune commande en attente</p>
                </div>
            `;
        } else {
            mode2Orders.forEach(order => {
                const orderCard = document.createElement('div');
                orderCard.className = 'newonInventOrderCard';
                orderCard.setAttribute('data-order-id', order.id);
                
                const totalAmount = order.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
                const itemCount = order.items.reduce((count, item) => count + item.quantity, 0);
                
                orderCard.innerHTML = `
                    <div class="newonInventOrderInfo">
                        <div class="newonInventOrderClient">
                            <i class="fas fa-user-circle"></i>
                            <span>${order.clientName}</span>
                        </div>
                        <div class="newonInventOrderTime">
                            <i class="fas fa-clock"></i>
                            <span>${new Date(order.timestamp).toLocaleTimeString()}</span>
                        </div>
                    </div>
                    <div class="newonInventOrderSummary">
                        <div class="newonInventOrderItems">
                            <i class="fas fa-shopping-bag"></i>
                            <span>${itemCount} article${itemCount > 1 ? 's' : ''}</span>
                        </div>
                        <div class="newonInventOrderTotal">
                            <span>${totalAmount.toFixed(2)} USD</span>
                        </div>
                    </div>
                    <button class="newonInventProcessBtn">
                        <i class="fas fa-cash-register"></i>
                        <span>Traiter</span>
                    </button>
                `;
                
                orderQueueElement.appendChild(orderCard);
                
                // Ajoute un écouteur pour le bouton "Traiter"
                orderCard.querySelector('.newonInventProcessBtn').addEventListener('click', function() {
                    processOrder(order.id, 'twoSellers');
                });
            });
        }
    }
    
    // Met à jour la liste des commandes pour les caissiers (Mode 3)
    const orderQueueElement3 = document.getElementById('newonInventOrderQueue3');
    if (orderQueueElement3) {
        orderQueueElement3.innerHTML = '';
        
        // Filtre les commandes pour ce caissier dans le mode 3
        const mode3Orders = pendingOrders.filter(order => order.fromMode === 'threeSellers');
        
        if (mode3Orders.length === 0) {
            orderQueueElement3.innerHTML = `
                <div class="newonInventEmptyState">
                    <i class="fas fa-clipboard-check"></i>
                    <p>Aucune commande en attente</p>
                </div>
            `;
        } else {
            mode3Orders.forEach(order => {
                const orderCard = document.createElement('div');
                orderCard.className = 'newonInventOrderCard';
                orderCard.setAttribute('data-order-id', order.id);
                
                const totalAmount = order.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
                const itemCount = order.items.reduce((count, item) => count + item.quantity, 0);
                
                orderCard.innerHTML = `
                    <div class="newonInventOrderInfo">
                        <div class="newonInventOrderClient">
                            <i class="fas fa-user-circle"></i>
                            <span>${order.clientName}</span>
                        </div>
                        <div class="newonInventOrderTime">
                            <i class="fas fa-clock"></i>
                            <span>${new Date(order.timestamp).toLocaleTimeString()}</span>
                        </div>
                    </div>
                    <div class="newonInventOrderSummary">
                        <div class="newonInventOrderItems">
                            <i class="fas fa-shopping-bag"></i>
                            <span>${itemCount} article${itemCount > 1 ? 's' : ''}</span>
                        </div>
                        <div class="newonInventOrderTotal">
                            <span>${totalAmount.toFixed(2)} USD</span>
                        </div>
                    </div>
                    <button class="newonInventProcessBtn">
                        <i class="fas fa-cash-register"></i>
                        <span>Traiter</span>
                    </button>
                `;
                
                orderQueueElement3.appendChild(orderCard);
                
                // Ajoute un écouteur pour le bouton "Traiter"
                orderCard.querySelector('.newonInventProcessBtn').addEventListener('click', function() {
                    processOrder(order.id, 'threeSellers');
                });
            });
        }
    }
    
    // Met à jour la liste des commandes pour les livreurs
    const deliveryQueueElement = document.getElementById('newonInventDeliveryQueue');
    if (deliveryQueueElement) {
        deliveryQueueElement.innerHTML = '';
        
        if (deliveryOrders.length === 0) {
            deliveryQueueElement.innerHTML = `
                <div class="newonInventEmptyState">
                    <i class="fas fa-box-open"></i>
                    <p>Aucune commande à livrer</p>
                </div>
            `;
        } else {
            deliveryOrders.forEach(order => {
                const orderCard = document.createElement('div');
                orderCard.className = 'newonInventOrderCard';
                orderCard.setAttribute('data-order-id', order.id);
                
                const itemCount = order.items.reduce((count, item) => count + item.quantity, 0);
                
                orderCard.innerHTML = `
                    <div class="newonInventOrderInfo">
                        <div class="newonInventOrderClient">
                            <i class="fas fa-user-circle"></i>
                            <span>${order.clientName}</span>
                        </div>
                        <div class="newonInventOrderTime">
                            <i class="fas fa-clock"></i>
                            <span>${new Date(order.timestamp).toLocaleTimeString()}</span>
                        </div>
                    </div>
                    <div class="newonInventOrderSummary">
                        <div class="newonInventOrderItems">
                            <i class="fas fa-shopping-bag"></i>
                            <span>${itemCount} article${itemCount > 1 ? 's' : ''}</span>
                        </div>
                    </div>
                    <button class="newonInventProcessBtn">
                        <i class="fas fa-truck"></i>
                        <span>Livrer</span>
                    </button>
                `;
                
                deliveryQueueElement.appendChild(orderCard);
                
                // Ajoute un écouteur pour le bouton "Livrer"
                orderCard.querySelector('.newonInventProcessBtn').addEventListener('click', function() {
                    processDelivery(order.id);
                });
            });
        }
    }
}


// Affiche les détails d'une commande à traiter par le caissier
function processOrder(orderId, mode) {
    // Trouve la commande
    const order = pendingOrders.find(o => o.id === orderId);
    
    if (order) {
        // Détermine les éléments DOM en fonction du mode
        let processOrder, processItems, processTotal, processCurrency, processClientName, 
            confirmPaymentBtn, cancelProcessBtn;
            
        if (mode === 'twoSellers') {
            processOrder = document.getElementById('newonInventProcessOrder');
            processItems = document.getElementById('newonInventProcessItems');
            processTotal = document.getElementById('newonInventProcessTotal');
            processCurrency = document.getElementById('newonInventProcessCurrency');
            processClientName = document.getElementById('newonInventProcessClientName');
            confirmPaymentBtn = document.getElementById('newonInventConfirmPayment');
            cancelProcessBtn = document.getElementById('newonInventCancelProcess');
        } else {
            processOrder = document.getElementById('newonInventProcessOrder3');
            processItems = document.getElementById('newonInventProcessItems3');
            processTotal = document.getElementById('newonInventProcessTotal3');
            processCurrency = document.getElementById('newonInventProcessCurrency3');
            processClientName = document.getElementById('newonInventProcessClientName3');
            confirmPaymentBtn = document.getElementById('newonInventConfirmPayment3');
            cancelProcessBtn = document.getElementById('newonInventCancelProcess3');
        }
        
        // Affiche le nom du client
        processClientName.textContent = order.clientName;
        
        // Affiche les articles
        processItems.innerHTML = '';
        order.items.forEach(item => {
            const itemElement = document.createElement('div');
            itemElement.className = 'newonInventCartItem';
            
            const displayPrice = (item.price * item.quantity).toFixed(2) + (item.currency === 'usd' ? ' $' : ' FC');
            
            itemElement.innerHTML = `
                <div class="product-info">
                    <div class="product-name">${item.name}</div>
                    <div class="product-quantity">x${item.quantity}</div>
                </div>
                <div class="product-price">${displayPrice}</div>
            `;
            
            processItems.appendChild(itemElement);
        });
        
        // Calcule et affiche le total
        const total = order.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        processTotal.textContent = total.toFixed(2);
        
        // Détermine la devise à partir du premier article
        const currency = order.items.length > 0 ? order.items[0].currency.toUpperCase() : 'USD';
        processCurrency.textContent = currency;
        
        // Réinitialise la sélection du mode de paiement
        const paymentBtns = processOrder.querySelectorAll('.newonInventPayBtn');
        paymentBtns.forEach(btn => {
            btn.classList.remove('active');
        });
        
        // Désactive le bouton de confirmation
        confirmPaymentBtn.disabled = true;
        
        // Supprime l'ancien orderCard s'il existe
        const oldOrderCard = processOrder.querySelector('.newonInventOrderCard');
        if (oldOrderCard) {
            oldOrderCard.remove();
        }
        
        // Ajoute l'ID de la commande à la zone de traitement
        const orderCardElement = document.createElement('div');
        orderCardElement.className = 'newonInventOrderCard';
        orderCardElement.setAttribute('data-order-id', order.id);
        orderCardElement.style.display = 'none';
        processOrder.appendChild(orderCardElement);
        
        // Ajoute un écouteur pour le bouton d'annulation
        cancelProcessBtn.onclick = function() {
            processOrder.style.display = 'none';
        };
        
        // Affiche la zone de traitement
        processOrder.style.display = 'block';
    }
}


// Affiche les détails d'une commande à livrer
function processDelivery(orderId) {
    // Trouve la commande
    const order = deliveryOrders.find(o => o.id === orderId);
    
    if (order) {
        // Récupère les éléments DOM
        const deliveryProcess = document.getElementById('newonInventDeliveryProcess');
        const deliveryItems = document.getElementById('newonInventDeliveryItems');
        const deliveryClientName = document.getElementById('newonInventDeliveryClientName');
        
        // Affiche le nom du client
        deliveryClientName.textContent = order.clientName;
        
        // Affiche les articles
        deliveryItems.innerHTML = '';
        order.items.forEach(item => {
            const itemElement = document.createElement('div');
            itemElement.className = 'newonInventCartItem';
            
            itemElement.innerHTML = `
                <div class="product-info">
                    <div class="product-name">${item.name}</div>
                    <div class="product-quantity">x${item.quantity}</div>
                </div>
            `;
            
            deliveryItems.appendChild(itemElement);
        });
        
        // Ajoute l'ID de la commande à la zone de livraison
        const orderCardElement = document.createElement('div');
        orderCardElement.className = 'newonInventOrderCard';
        orderCardElement.setAttribute('data-order-id', order.id);
        orderCardElement.style.display = 'none';
        deliveryProcess.appendChild(orderCardElement);
        
        // Ajoute un écouteur pour le bouton de confirmation de livraison
        document.getElementById('newonInventConfirmDelivery').addEventListener('click', function() {
            confirmDelivery(order.id);
        });
        
        // Ajoute un écouteur pour le bouton d'annulation
        document.getElementById('newonInventCancelDelivery').addEventListener('click', function() {
            document.getElementById('newonInventDeliveryProcess').style.display = 'none';
        });
        
        // Affiche la zone de livraison
        deliveryProcess.style.display = 'block';
    }
}

// Confirme la livraison d'une commande
function confirmDelivery(orderId) {
    // Trouve la commande
    const order = deliveryOrders.find(o => o.id === orderId);
    
    if (order) {
        // Met à jour le statut de la commande
        order.status = 'delivered';
        order.deliveryTime = new Date();
        
        // Supprime la commande des commandes à livrer
        deliveryOrders = deliveryOrders.filter(o => o.id !== orderId);
        
        // Génère le reçu
        generateReceipt(order.clientName, order.items, order.paymentInfo);
        
        // Ouvre la modale du reçu
        const receiptModal = new bootstrap.Modal(document.getElementById('newonInventReceiptModal'));
        receiptModal.show();
        
        // Cache la zone de livraison
        document.getElementById('newonInventDeliveryProcess').style.display = 'none';
        
        // Réaffiche la liste des commandes à livrer
        updatePendingOrdersList();
        
        // Affiche un message de confirmation
        alert(`Livraison confirmée pour ${order.clientName}.`);
    }
}

// Données de démonstration pour les produits récemment vendus
const ManualModeSaisie_recentProducts = [
    { id: 'P001', name: 'Smartphone XYZ', price: 250, currency: 'usd', stock: 15 },
    { id: 'P002', name: 'Chargeur USB', price: 15, currency: 'usd', stock: 30 },
    { id: 'P003', name: 'Écouteurs sans fil', price: 45, currency: 'usd', stock: 10 }
];

// Initialisation de la recherche produit améliorée
function ManualModeSaisie_initProductSearch() {
    // Sélection des éléments d'interface pour chaque zone
    const searchInputs = [
        document.getElementById('newonInventManualCode'),
        document.getElementById('newonInventManualCode2'),
        document.getElementById('newonInventManualCode3')
    ];
    
    const searchButtons = [
        document.getElementById('newonInventFindProduct'),
        document.getElementById('newonInventFindProduct2'),
        document.getElementById('newonInventFindProduct3')
    ];
    
    const resultLists = [
        document.getElementById('ManualModeSaisie_resultsList'),
        document.getElementById('ManualModeSaisie_resultsList2'),
        document.getElementById('ManualModeSaisie_resultsList3')
    ];
    
    const recentItemsContainers = [
        document.getElementById('ManualModeSaisie_recentItems'),
        document.getElementById('ManualModeSaisie_recentItems2'),
        document.getElementById('ManualModeSaisie_recentItems3')
    ];
    
    // Pour chaque zone de saisie
    searchInputs.forEach((input, index) => {
        if (!input) return;
        
        // Afficher les produits récents au chargement
        ManualModeSaisie_displayRecentProducts(recentItemsContainers[index], index);
        
        // Événement de saisie pour recherche en temps réel
        input.addEventListener('input', function(e) {
            const searchTerm = e.target.value.trim();
            
            if (searchTerm.length >= 2) {
                // Effectuer la recherche
                ManualModeSaisie_searchProducts(searchTerm, resultLists[index], index);
            } else {
                // Vider les résultats si moins de 2 caractères
                resultLists[index].innerHTML = '';
            }
        });
        
        // Événement sur le bouton de recherche
        if (searchButtons[index]) {
            searchButtons[index].addEventListener('click', function() {
                const searchTerm = input.value.trim();
                
                if (searchTerm.length > 0) {
                    // Effectuer la recherche
                    ManualModeSaisie_searchProducts(searchTerm, resultLists[index], index);
                }
            });
        }
        
        // Événement pour touche Entrée
        input.addEventListener('keydown', function(e) {
            if (e.key === 'Enter') {
                const searchTerm = input.value.trim();
                
                if (searchTerm.length > 0) {
                    e.preventDefault();
                    // Effectuer la recherche
                    ManualModeSaisie_searchProducts(searchTerm, resultLists[index], index);
                }
            }
        });
    });
}

// Fonction de recherche de produits
function ManualModeSaisie_searchProducts(searchTerm, resultContainer, zoneIndex) {
    if (!resultContainer) return;
    
    // Afficher un indicateur de chargement
    resultContainer.innerHTML = `
        <div class="ManualModeSaisie_loading">
            <i class="fas fa-spinner"></i>
            <span>Recherche en cours...</span>
        </div>
    `;
    
    // Simulation d'une recherche (à remplacer par votre véritable fonction de recherche)
    setTimeout(() => {
        // Filtrer les produits qui correspondent au terme de recherche
        const results = inventoryData.filter(product => 
            product.id.toLowerCase().includes(searchTerm.toLowerCase()) || 
            product.name.toLowerCase().includes(searchTerm.toLowerCase())
        );
        
        // Afficher les résultats
        ManualModeSaisie_displaySearchResults(results, resultContainer, zoneIndex);
    }, 300); // Délai simulé de 300ms
}

// Afficher les résultats de recherche
function ManualModeSaisie_displaySearchResults(products, container, zoneIndex) {
    if (!container) return;
    
    // Vider le conteneur
    container.innerHTML = '';
    
    // Si aucun résultat
    if (products.length === 0) {
        container.innerHTML = `
            <div class="ManualModeSaisie_noResults">
                <i class="fas fa-search"></i>
                <p>Aucun produit trouvé</p>
            </div>
        `;
        return;
    }
    
    // Ajouter chaque produit aux résultats
    products.forEach(product => {
        const productElement = document.createElement('div');
        productElement.className = 'ManualModeSaisie_productItem';
        
        const displayPrice = product.price.toFixed(2) + (product.currency === 'usd' ? ' $' : ' FC');
        
        productElement.innerHTML = `
            <div class="ManualModeSaisie_productDetails">
                <div class="ManualModeSaisie_productName">${product.name}</div>
                <div class="ManualModeSaisie_productCode">${product.id} | Stock: ${product.stock}</div>
            </div>
            <div class="ManualModeSaisie_productPrice">${displayPrice}</div>
            <button class="ManualModeSaisie_addBtn" data-product-id="${product.id}">
                <i class="fas fa-plus"></i>
            </button>
        `;
        
        // Ajouter au conteneur
        container.appendChild(productElement);
        
        // Événement de clic sur le produit entier pour l'ajouter
        productElement.addEventListener('click', function() {
            findAndAddProduct(product.id, zoneIndex);
        });
        
        // Événement de clic sur le bouton d'ajout
        const addButton = productElement.querySelector('.ManualModeSaisie_addBtn');
        addButton.addEventListener('click', function(e) {
            e.stopPropagation(); // Empêche le déclenchement du clic sur tout le produit
            findAndAddProduct(product.id, zoneIndex);
        });
    });
}

// Afficher les produits récemment vendus
function ManualModeSaisie_displayRecentProducts(container, zoneIndex) {
    if (!container) return;
    
    // Vider le conteneur
    container.innerHTML = '';
    
    // Ajouter chaque produit récent
    ManualModeSaisie_recentProducts.forEach(product => {
        const productElement = document.createElement('div');
        productElement.className = 'ManualModeSaisie_productItem';
        
        const displayPrice = product.price.toFixed(2) + (product.currency === 'usd' ? ' $' : ' FC');
        
        productElement.innerHTML = `
            <div class="ManualModeSaisie_productDetails">
                <div class="ManualModeSaisie_productName">${product.name}</div>
                <div class="ManualModeSaisie_productCode">${product.id}</div>
            </div>
            <div class="ManualModeSaisie_productPrice">${displayPrice}</div>
            <button class="ManualModeSaisie_addBtn" data-product-id="${product.id}">
                <i class="fas fa-plus"></i>
            </button>
        `;
        
        // Ajouter au conteneur
        container.appendChild(productElement);
        
        // Événement de clic sur le produit entier pour l'ajouter
        productElement.addEventListener('click', function() {
            findAndAddProduct(product.id, zoneIndex);
        });
        
        // Événement de clic sur le bouton d'ajout
        const addButton = productElement.querySelector('.ManualModeSaisie_addBtn');
        addButton.addEventListener('click', function(e) {
            e.stopPropagation(); // Empêche le déclenchement du clic sur tout le produit
            findAndAddProduct(product.id, zoneIndex);
        });
    });
}

// Mettre à jour la liste des produits récents après un ajout
function ManualModeSaisie_updateRecentProducts(product) {
    // Vérifier si le produit est déjà dans la liste des récents
    const existingIndex = ManualModeSaisie_recentProducts.findIndex(p => p.id === product.id);
    
    if (existingIndex !== -1) {
        // Supprimer le produit de sa position actuelle
        ManualModeSaisie_recentProducts.splice(existingIndex, 1);
    }
    
    // Ajouter le produit au début de la liste
    ManualModeSaisie_recentProducts.unshift(product);
    
    // Limiter la liste à 5 produits
    if (ManualModeSaisie_recentProducts.length > 5) {
        ManualModeSaisie_recentProducts.pop();
    }
    
    // Mettre à jour l'affichage dans chaque zone
    const recentContainers = [
        document.getElementById('ManualModeSaisie_recentItems'),
        document.getElementById('ManualModeSaisie_recentItems2'),
        document.getElementById('ManualModeSaisie_recentItems3')
    ];
    
    recentContainers.forEach((container, index) => {
        if (container) {
            ManualModeSaisie_displayRecentProducts(container, index);
        }
    });
}

    
// Initialise le module de point de vente
function initSalesPoint() {
    // Initialisation des services audio
    ScannerFeedback.initAudio();
    ManualEntryFeedback.initAudio();
    PaymentFeedback.init();
    
    // Charge les données d'inventaire
    loadInventoryData();
    
    // Initialise le sélecteur de mode
    initModeSelectorCard();
    
    // Initialise les scanners
    initScanners();
    
    // Initialise la saisie manuelle
    initManualEntry();
    
    // Initialise les écouteurs d'événements
    initSalesEventListeners();
}


    
    // Initialise le module quand on clique sur le lien dans la barre latérale
    document.querySelector('[data-section="newonInventSalesPoint"]').addEventListener('click', function() {
        // Réinitialise les interfaces
        resetAllInterfaces();
        
        // Affiche le sélecteur de mode
        document.getElementById('newonInventSelectMode').style.display = 'block';
        
        // Initialise le point de vente si ce n'est pas déjà fait
        if (!window.salesPointInitialized) {
            initSalesPoint();
            window.salesPointInitialized = true;
        }
    });
    
    // Initialise le point de vente quand on navigue directement vers cette section
    if (window.location.hash === '#newonInventSalesPoint') {
        document.querySelector('[data-section="newonInventSalesPoint"]').click();
    }
});






  
/*══════════════════════════════╗
  🔴 JS PARTIE 9
  ═════════════════════════════╝*/

  // Gestion des rôles d'administrateurs pour le point de vente
document.addEventListener('DOMContentLoaded', function() {
    // Configuration initiale
    const GestVenteAdmin_config = {
        type: 'solo', // Type de configuration (solo, medium, large)
        assignments: {} // Assignations des administrateurs aux rôles
    };
    
    // Liste fictive d'administrateurs (normalement chargée depuis la base de données)
    const GestVenteAdmin_adminsList = [
        { id: 'admin1', name: 'Admin Principal', badge: 'primary', role: 'admin', online: true, lastLogin: new Date(), createdAt: new Date('2025-04-25') },
        { id: 'admin2', name: 'Jean Dupont', badge: 'standard', role: 'standard', online: false, lastLogin: new Date('2025-04-24 15:40'), createdAt: new Date('2025-04-23') },
        { id: 'admin3', name: 'Likula Jean-Louis', badge: 'standard', role: 'standard', online: true, lastLogin: new Date('2025-04-25 09:15'), createdAt: new Date('2025-04-20') },
        { id: 'admin4', name: 'Marie Laurent', badge: 'standard', role: 'standard', online: false, lastLogin: new Date('2025-04-23 11:30'), createdAt: new Date('2025-04-18') }
    ];
    
    // Définition des rôles et leur description selon la configuration
    const GestVenteAdmin_roleDefinitions = {
        solo: {
            type: 'Boutique individuelle',
            roles: {
                gestionnaire: {
                    name: 'Gestionnaire',
                    icon: 'user-tie',
                    badge: 'solo',
                    description: 'Gère toutes les étapes de la vente: accueil client, scan des produits, encaissement et livraison.'
                }
            },
            explanation: 'Dans cette configuration, chaque gestionnaire peut traiter une vente complète, de l\'accueil du client jusqu\'à la livraison des produits.'
        },
        medium: {
            type: 'Boutique moyenne',
            roles: {
                recepteur: {
                    name: 'Récepteur de commandes',
                    icon: 'clipboard-list',
                    badge: 'recepteur',
                    description: 'Accueille les clients, enregistre leurs besoins et transfère les commandes au caissier.'
                },
                caissier: {
                    name: 'Caissier',
                    icon: 'cash-register',
                    badge: 'caissier',
                    description: 'Reçoit les paiements et coordonne la livraison des produits au client.'
                }
            },
            explanation: 'Cette configuration sépare la prise de commande et l\'encaissement. Le récepteur enregistre la commande et la transmet au caissier qui finalise la vente.'
        },
        large: {
            type: 'Grand commerce',
            roles: {
                recepteur: {
                    name: 'Récepteur de commandes',
                    icon: 'clipboard-list',
                    badge: 'recepteur',
                    description: 'Accueille les clients, enregistre leurs besoins et transfère les commandes au caissier.'
                },
                caissier: {
                    name: 'Caissier',
                    icon: 'cash-register',
                    badge: 'caissier',
                    description: 'Reçoit les paiements et transmet les commandes payées au livreur.'
                },
                livreur: {
                    name: 'Livreur',
                    icon: 'box',
                    badge: 'livreur',
                    description: 'Prépare les produits demandés et les remet au client après paiement.'
                }
            },
            explanation: 'Cette configuration convient aux grands commerces avec une séparation complète entre la prise de commande, l\'encaissement et la livraison des produits.'
        }
    };
    
    // Références aux éléments DOM
    const GestVenteAdmin_currentType = document.getElementById('GestVenteAdmin_current-type');
    const GestVenteAdmin_helpBtn = document.getElementById('GestVenteAdmin_help-btn');
    const GestVenteAdmin_changeConfigBtn = document.getElementById('GestVenteAdmin_change-config');
    const GestVenteAdmin_assignRolesBtn = document.getElementById('GestVenteAdmin_assign-roles');
    const GestVenteAdmin_assignedRoles = document.getElementById('GestVenteAdmin_assigned-roles');
    const GestVenteAdmin_saveConfigBtn = document.getElementById('GestVenteAdmin_save-config');
    const GestVenteAdmin_saveAssignmentsBtn = document.getElementById('GestVenteAdmin_save-assignments');
    const GestVenteAdmin_modalConfigType = document.getElementById('GestVenteAdmin_modal-config-type');
    const GestVenteAdmin_rolesExplanation = document.getElementById('GestVenteAdmin_roles-explanation');
    const GestVenteAdmin_roleAssignments = document.getElementById('GestVenteAdmin_role-assignments');
    
    // Modales Bootstrap
    const GestVenteAdmin_helpModal = new bootstrap.Modal(document.getElementById('GestVenteAdmin_helpModal'));
    const GestVenteAdmin_configModal = new bootstrap.Modal(document.getElementById('GestVenteAdmin_configModal'));
    const GestVenteAdmin_assignRolesModal = new bootstrap.Modal(document.getElementById('GestVenteAdmin_assignRolesModal'));
    
    // Initialisation
    function GestVenteAdmin_init() {
        // Mise à jour de l'interface selon la configuration actuelle
        GestVenteAdmin_updateConfigUI();
        
        // Mise à jour de la liste des rôles assignés
        GestVenteAdmin_refreshAssignedRoles();
        
        // Gestion des événements
        GestVenteAdmin_setupEventListeners();
    }
    
    // Mise à jour de l'interface selon la configuration
    function GestVenteAdmin_updateConfigUI() {
        // Mise à jour du type de configuration affiché
        const configType = GestVenteAdmin_roleDefinitions[GestVenteAdmin_config.type].type;
        GestVenteAdmin_currentType.textContent = configType;
        
        // Mise à jour dans la modale d'assignation
        GestVenteAdmin_modalConfigType.textContent = configType;
        
        // Mise à jour de l'explication des rôles
        GestVenteAdmin_rolesExplanation.textContent = GestVenteAdmin_roleDefinitions[GestVenteAdmin_config.type].explanation;
    }
    
    // Raffraîchir la liste des administrateurs assignés à des rôles
    function GestVenteAdmin_refreshAssignedRoles() {
        // Vider le conteneur
        GestVenteAdmin_assignedRoles.innerHTML = '';
        
        const roleConfig = GestVenteAdmin_roleDefinitions[GestVenteAdmin_config.type];
        const assignments = GestVenteAdmin_config.assignments[GestVenteAdmin_config.type] || {};
        
        // Vérifier s'il y a des assignations
        let hasAssignments = false;
        
        // Parcourir les rôles pour cette configuration
        for (const roleKey in roleConfig.roles) {
            const role = roleConfig.roles[roleKey];
            const assignedAdmins = assignments[roleKey] || [];
            
            // Ajouter les administrateurs assignés à ce rôle
            assignedAdmins.forEach(adminId => {
                hasAssignments = true;
                const admin = GestVenteAdmin_adminsList.find(a => a.id === adminId);
                if (admin) {
                    const roleItem = document.createElement('div');
                    roleItem.className = 'GestVenteAdmin_role-item';
                    roleItem.dataset.adminId = admin.id;
                    roleItem.dataset.roleKey = roleKey;
                    
                    roleItem.innerHTML = `
                        <div class="GestVenteAdmin_role-header">
                            <span class="GestVenteAdmin_role-badge ${role.badge}">
                                <i class="fas fa-${role.icon}"></i> ${role.name}
                            </span>
                        </div>
                        <span class="GestVenteAdmin_admin-name">${admin.name}</span>
                        <span class="GestVenteAdmin_admin-joined">
                            <i class="fas fa-calendar-alt"></i> Depuis le ${admin.createdAt.toLocaleDateString('fr-FR')}
                        </span>
                        <div class="GestVenteAdmin_role-actions">
                            <div class="GestVenteAdmin_role-action" title="Retirer du rôle" onclick="GestVenteAdmin_removeAssignment('${admin.id}', '${roleKey}')">
                                <i class="fas fa-times"></i>
                            </div>
                        </div>
                    `;
                    
                    GestVenteAdmin_assignedRoles.appendChild(roleItem);
                }
            });
        }
        
        // Afficher un message si aucun administrateur n'est assigné
        if (!hasAssignments) {
            const emptyMessage = document.createElement('div');
            emptyMessage.className = 'text-center py-4 text-muted';
            emptyMessage.innerHTML = `
                <i class="fas fa-user-tag fa-3x mb-3"></i>
                <p>Aucun administrateur assigné aux rôles de vente</p>
                <button class="btn btn-sm btn-outline-primary mt-2" onclick="document.getElementById('GestVenteAdmin_assign-roles').click()">
                    <i class="fas fa-user-plus"></i> Assigner des administrateurs
                </button>
            `;
            GestVenteAdmin_assignedRoles.appendChild(emptyMessage);
        }
    }
    
    // Générer le contenu de la modale d'assignation des rôles
    function GestVenteAdmin_generateRoleAssignments() {
        // Vider le conteneur
        GestVenteAdmin_roleAssignments.innerHTML = '';
        
        const roleConfig = GestVenteAdmin_roleDefinitions[GestVenteAdmin_config.type];
        const assignments = GestVenteAdmin_config.assignments[GestVenteAdmin_config.type] || {};
        
        // Parcourir les rôles pour cette configuration
        for (const roleKey in roleConfig.roles) {
            const role = roleConfig.roles[roleKey];
            const assignedAdmins = assignments[roleKey] || [];
            
            // Créer le groupe de rôles
            const roleGroup = document.createElement('div');
            roleGroup.className = 'GestVenteAdmin_role-group';
            roleGroup.dataset.roleKey = roleKey;
            
            // En-tête du groupe
            roleGroup.innerHTML = `
                <div class="GestVenteAdmin_role-group-header">
                    <div class="GestVenteAdmin_role-group-icon ${role.badge}">
                        <i class="fas fa-${role.icon}"></i>
                    </div>
                    <div>
                        <h6 class="GestVenteAdmin_role-group-title">${role.name}</h6>
                        <p class="GestVenteAdmin_role-group-description">${role.description}</p>
                    </div>
                </div>
                <div class="GestVenteAdmin_role-selectors" data-role-key="${roleKey}">
                    <!-- Les sélecteurs d'admins seront ajoutés ici -->
                </div>
            `;
            
            GestVenteAdmin_roleAssignments.appendChild(roleGroup);
            
            // Récupérer le conteneur des sélecteurs
            const selectors = roleGroup.querySelector('.GestVenteAdmin_role-selectors');
            
            // Ajouter les sélecteurs pour chaque admin
            GestVenteAdmin_adminsList.forEach(admin => {
                const isAssigned = assignedAdmins.includes(admin.id);
                const adminSelector = document.createElement('div');
                adminSelector.className = `GestVenteAdmin_admin-selector ${isAssigned ? 'selected' : ''}`;
                adminSelector.dataset.adminId = admin.id;
                
                adminSelector.innerHTML = `
                    <div class="GestVenteAdmin_admin-selector-check"></div>
                    <span class="GestVenteAdmin_admin-selector-name">${admin.name}</span>
                `;
                
                adminSelector.addEventListener('click', function() {
                    this.classList.toggle('selected');
                });
                
                selectors.appendChild(adminSelector);
            });
            
            // Ajouter le bouton pour ajouter un admin
            const addAdminBtn = document.createElement('div');
            addAdminBtn.className = 'GestVenteAdmin_add-admin-btn';
            addAdminBtn.innerHTML = `
                <i class="fas fa-plus"></i> Ajouter un administrateur
            `;
            addAdminBtn.addEventListener('click', function() {
                // Cette fonctionnalité ouvrirait normalement une modale pour créer un nouvel admin
                showNotification('Cette fonctionnalité permettrait de créer un nouvel administrateur.', 'info');
            });
            
            selectors.appendChild(addAdminBtn);
        }
    }
    
    // Configuration des écouteurs d'événements
    function GestVenteAdmin_setupEventListeners() {
        // Bouton d'aide
        GestVenteAdmin_helpBtn.addEventListener('click', function() {
            GestVenteAdmin_helpModal.show();
        });
        
        // Bouton de changement de configuration
        GestVenteAdmin_changeConfigBtn.addEventListener('click', function() {
            // Sélectionner la configuration actuelle
            const configOptions = document.querySelectorAll('.GestVenteAdmin_config-option');
            configOptions.forEach(option => {
                option.classList.remove('selected');
                if (option.dataset.configType === GestVenteAdmin_config.type) {
                    option.classList.add('selected');
                }
            });
            
            GestVenteAdmin_configModal.show();
        });
        
        // Bouton d'assignation des rôles
        GestVenteAdmin_assignRolesBtn.addEventListener('click', function() {
            GestVenteAdmin_generateRoleAssignments();
            GestVenteAdmin_assignRolesModal.show();
        });
        
        // Sélection d'une configuration
        document.querySelectorAll('.GestVenteAdmin_config-option').forEach(option => {
            option.addEventListener('click', function() {
                // Désélectionner toutes les options
                document.querySelectorAll('.GestVenteAdmin_config-option').forEach(opt => {
                    opt.classList.remove('selected');
                });
                
                // Sélectionner cette option
                this.classList.add('selected');
            });
        });
        
        // Sauvegarde de la configuration
        GestVenteAdmin_saveConfigBtn.addEventListener('click', function() {
            const selectedOption = document.querySelector('.GestVenteAdmin_config-option.selected');
            if (selectedOption) {
                const newConfigType = selectedOption.dataset.configType;
                
                // Vérifier si la configuration a changé
                if (newConfigType !== GestVenteAdmin_config.type) {
                    // Mettre à jour la configuration
                    GestVenteAdmin_config.type = newConfigType;
                    
                    // Initialiser les assignations pour cette configuration si nécessaire
                    if (!GestVenteAdmin_config.assignments[newConfigType]) {
                        GestVenteAdmin_config.assignments[newConfigType] = {};
                    }
                    
                    // Mettre à jour l'interface
                    GestVenteAdmin_updateConfigUI();
                    GestVenteAdmin_refreshAssignedRoles();
                    
                    showNotification('Configuration mise à jour avec succès.', 'success');
                }
                
                GestVenteAdmin_configModal.hide();
            }
        });
        
        // Sauvegarde des assignations
        GestVenteAdmin_saveAssignmentsBtn.addEventListener('click', function() {
            // Réinitialiser les assignations pour la configuration actuelle
            GestVenteAdmin_config.assignments[GestVenteAdmin_config.type] = {};
            
            // Parcourir les groupes de rôles
            document.querySelectorAll('.GestVenteAdmin_role-group').forEach(group => {
                const roleKey = group.dataset.roleKey;
                
                // Initialiser le tableau d'assignations pour ce rôle
                GestVenteAdmin_config.assignments[GestVenteAdmin_config.type][roleKey] = [];
                
                // Ajouter les administrateurs sélectionnés
                group.querySelectorAll('.GestVenteAdmin_admin-selector.selected').forEach(selector => {
                    const adminId = selector.dataset.adminId;
                    GestVenteAdmin_config.assignments[GestVenteAdmin_config.type][roleKey].push(adminId);
                });
            });
            
            // Mettre à jour l'interface
            GestVenteAdmin_refreshAssignedRoles();
            
            GestVenteAdmin_assignRolesModal.hide();
            showNotification('Rôles assignés avec succès.', 'success');
        });
    }
    
    // Fonction pour retirer un administrateur d'un rôle (appelée depuis le HTML)
    window.GestVenteAdmin_removeAssignment = function(adminId, roleKey) {
        // Vérifier si des assignations existent pour cette configuration
        if (GestVenteAdmin_config.assignments[GestVenteAdmin_config.type] &&
            GestVenteAdmin_config.assignments[GestVenteAdmin_config.type][roleKey]) {
            
            // Filtrer l'administrateur du tableau d'assignations
            GestVenteAdmin_config.assignments[GestVenteAdmin_config.type][roleKey] = 
                GestVenteAdmin_config.assignments[GestVenteAdmin_config.type][roleKey].filter(id => id !== adminId);
            
            // Mettre à jour l'interface
            GestVenteAdmin_refreshAssignedRoles();
            
            showNotification('Administrateur retiré du rôle avec succès.', 'success');
        }
    };
    
    // Initialiser la gestion des rôles
    GestVenteAdmin_init();
});



/*══════════════════════════════╗
  🟠 JS PARTIE 10
  ═════════════════════════════╝*/

/*══════════════════════════════╗
  🟡 JS PARTIE 11
  ═════════════════════════════╝*/

/*══════════════════════════════╗
  🟢 JS PARTIE 12
  ═════════════════════════════╝*/

/*══════════════════════════════╗
  🔵 JS PARTIE 13
  ═════════════════════════════╝*/

/*══════════════════════════════╗
  🟣 JS PARTIE 14
  ═════════════════════════════╝*/

/*══════════════════════════════╗
  🟤 JS PARTIE 15
  ═════════════════════════════╝*/

/*══════════════════════════════╗
  ⚫ JS PARTIE 16
  ═════════════════════════════╝*/

/*══════════════════════════════╗
  ⚪ JS PARTIE 17
  ═════════════════════════════╝*/

/*══════════════════════════════╗
  🟥 JS PARTIE 18
  ═════════════════════════════╝*/

/*══════════════════════════════╗
  🟧 JS PARTIE 19
  ═════════════════════════════╝*/

/*══════════════════════════════╗
  🟨 JS PARTIE 20
  ═════════════════════════════╝*/

/*══════════════════════════════╗
  🟩 JS PARTIE 21
  ═════════════════════════════╝*/

/*══════════════════════════════╗
  🟦 JS PARTIE 22
  ═════════════════════════════╝*/

/*══════════════════════════════╗
  🟪 JS PARTIE 23
  ═════════════════════════════╝*/

/*══════════════════════════════╗
  🟫 JS PARTIE 24
  ═════════════════════════════╝*/

/*══════════════════════════════╗
  ⬛ JS PARTIE 25
  ═════════════════════════════╝*/

/*══════════════════════════════╗
  ⬜ JS PARTIE 26
  ═════════════════════════════╝*/

/*══════════════════════════════╗
  ❤️ JS PARTIE 27
  ═════════════════════════════╝*/

/*══════════════════════════════╗
  🧡 JS PARTIE 28
  ═════════════════════════════╝*/

/*══════════════════════════════╗
  💛 JS PARTIE 29
  ═════════════════════════════╝*/

/*══════════════════════════════╗
  💚 JS PARTIE 30
  ═════════════════════════════╝*/