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
        recentProductsTable.innerHTML = '<tr><td colspan="5" class="text-center">Aucun produit trouvé</td></tr>';
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
        
        row.innerHTML = `
            <td>${product.name}</td>
            <td>${formattedPrice}</td>
            <td>${product.quantity}</td>
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
        inventoryTable.innerHTML = '<tr><td colspan="7" class="text-center">Aucun produit trouvé</td></tr>';
        return;
    }
    
    products.forEach(product => {
        const row = document.createElement('tr');
        
        // Formater le prix selon les préférences d'affichage
        const formattedPrice = formatPriceForDisplay(product.price, product.priceCurrency || 'usd');
        
        row.innerHTML = `
            <td>${product.code}</td>
            <td>${product.name}</td>
            <td>${formattedPrice}</td>
            <td>${product.quantity}</td>
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

        function initBarcodeScanner(videoElementId) {
            const videoElement = document.getElementById(videoElementId);
            
            if (scannerInitialized) {
                Quagga.stop();
                if (qrScannerInterval) {
                    clearInterval(qrScannerInterval);
                    qrScannerInterval = null;
                }
            }
            
            // Demander l'accès à la caméra
            navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } })
                .then(function(stream) {
                    videoElement.srcObject = stream;
                    videoElement.play();
                    
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
                            return;
                        }
                        scannerInitialized = true;
                        Quagga.start();
                    });
                    
                    // Écouter les résultats de Quagga
                    Quagga.onDetected(function(result) {
                        const code = result.codeResult.code;
                        console.log("Detected barcode:", code);
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
                                processScannedCode(code.data);
                            }
                        }
                    }, 500);
                })
                .catch(function(err) {
                    console.error("Error accessing camera:", err);
                    showNotification("Erreur", "Impossible d'accéder à la caméra.", "error");
                });
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
    
    // Générer les codes
    generateBarcode(product.code, '#edit-barcode-preview');
    
    const qrData = {
        code: product.code,
        name: product.name,
        price: product.price,
        currency: product.priceCurrency || 'usd'
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
    
    // Initialisation des boutons et popups
    setupThemeButton();
    setupDarkModeButton();
    setupLanguageButton();
    
    // Initialisation des événements pour les options des popups
    setupThemeOptions();
    setupLanguageOptions();
    
    // Initialisation du comportement des popups
    setupPopupBehavior();
}

function loadPreferences() {
    // Chargement du thème
    const theme = localStorage.getItem('theme') || 'default';
    document.documentElement.setAttribute('data-theme', theme);
    
    // Chargement du mode sombre/clair
    const darkMode = localStorage.getItem('darkMode') === 'true';
    if (darkMode) {
        document.documentElement.setAttribute('data-theme-mode', 'dark');
        document.getElementById('ThemeLangMode_darkModeBtn').innerHTML = '<i class="fas fa-sun"></i>';
    } else {
        document.documentElement.removeAttribute('data-theme-mode');
        document.getElementById('ThemeLangMode_darkModeBtn').innerHTML = '<i class="fas fa-moon"></i>';
    }
    
    // Mise à jour des UI elements pour refléter les préférences stockées
    const darkModeToggle = document.getElementById('ThemeLangMode_darkModeToggle');
    if (darkModeToggle) {
        darkModeToggle.checked = darkMode;
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
    
    if (isDarkMode) {
        document.documentElement.removeAttribute('data-theme-mode');
        document.getElementById('ThemeLangMode_darkModeBtn').innerHTML = '<i class="fas fa-moon"></i>';
        if (darkModeToggle) darkModeToggle.checked = false;
        localStorage.setItem('darkMode', 'false');
    } else {
        document.documentElement.setAttribute('data-theme-mode', 'dark');
        document.getElementById('ThemeLangMode_darkModeBtn').innerHTML = '<i class="fas fa-sun"></i>';
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
        const popups = document.querySelectorAll('.ThemeLangMode_popup');
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

  // JavaScript complet pour l'analyse IA de l'inventaire
document.addEventListener('DOMContentLoaded', function() {
    // ====== Données de simulation ======
    const mockProducts = [
        { id: 1, name: "Smartphone XL+", category: "electronics", stock: 32, sold: 78, price: 899, trend: 15 },
        { id: 2, name: "Écouteurs sans fil Pro", category: "electronics", stock: 45, sold: 64, price: 199, trend: 12 },
        { id: 3, name: "Montre connectée Sport", category: "electronics", stock: 28, sold: 52, price: 299, trend: 8 },
        { id: 4, name: "Enceinte portable waterproof", category: "electronics", stock: 40, sold: 49, price: 129, trend: 0 },
        { id: 5, name: "Batterie externe 20000mAh", category: "electronics", stock: 60, sold: 42, price: 59, trend: -5 },
        { id: 6, name: "Casque gaming standard", category: "electronics", stock: 35, sold: 10, price: 89, trend: -15 },
        { id: 7, name: "Table de salon design", category: "furniture", stock: 12, sold: 8, price: 349, trend: 3 },
        { id: 8, name: "Chaise de bureau ergonomique", category: "furniture", stock: 18, sold: 15, price: 249, trend: 5 },
        { id: 9, name: "T-shirt Premium", category: "clothing", stock: 120, sold: 85, price: 29, trend: -2 },
        { id: 10, name: "Jeans coupe slim", category: "clothing", stock: 80, sold: 62, price: 59, trend: 4 },
        { id: 11, name: "Snacks assortis", category: "food", stock: 150, sold: 130, price: 3.5, trend: 10 },
        { id: 12, name: "Boissons énergisantes", category: "food", stock: 200, sold: 180, price: 2.5, trend: 8 }
    ];

    const mockCategories = [
        { id: "electronics", name: "Électronique", icon: "fas fa-tv", prediction: 18 },
        { id: "furniture", name: "Mobilier", icon: "fas fa-couch", prediction: 5 },
        { id: "clothing", name: "Vêtements", icon: "fas fa-tshirt", prediction: -2 },
        { id: "food", name: "Alimentaire", icon: "fas fa-utensils", prediction: 10 }
    ];

    const mockSalesData = {
        week: [42, 38, 52, 48, 62, 59, 78],
        month: [150, 165, 180, 168, 172, 190, 185, 210, 195, 215, 220, 225, 230, 218, 225, 240, 235, 250, 242, 265, 260, 270, 275, 290, 285, 295, 300, 310, 320, 325],
        year: [3200, 3500, 3800, 4100, 4300, 4600, 4900, 5200, 5500, 5800, 5950, 6100]
    };

    const mockRecommendations = [
        { id: 1, type: "increase_stock", icon: "fas fa-arrow-up", title: "Augmenter le stock de Smartphone XL+", description: "Les ventes augmentent de 15% chaque mois depuis 3 mois." },
        { id: 2, type: "price_up", icon: "fas fa-percentage", title: "Augmenter le prix des Écouteurs sans fil Pro", description: "Forte demande avec une élasticité-prix favorable. Potentiel +15% sans impact sur les ventes." },
        { id: 3, type: "reduce_stock", icon: "fas fa-arrow-down", title: "Réduire le stock de Casques gaming standard", description: "Rotation lente, 35 unités en stock depuis plus de 60 jours." },
        { id: 4, type: "restock", icon: "fas fa-exclamation-triangle", title: "Réapprovisionner en Montre connectée Sport", description: "Stock faible (28) et ventes en hausse. Risque de rupture dans 15 jours." },
        { id: 5, type: "promotion", icon: "fas fa-tags", title: "Lancer une promotion sur Batterie externe 20000mAh", description: "Baisse des ventes de 5% et stock important. Promotion recommandée pour accélérer l'écoulement." },
        { id: 6, type: "bundle", icon: "fas fa-box-open", title: "Créer un bundle Smartphone + Écouteurs", description: "Ces produits sont souvent achetés ensemble. Un bundle augmenterait la valeur moyenne des commandes." }
    ];

    // ====== Éléments DOM ======
    const analyzeBtn = document.getElementById('AnalInvenIa-runBtn');
    const filterTabs = document.querySelectorAll('.AnalInvenIa-tab[data-filter]');
    const customFilterTabs = document.querySelectorAll('.AnalInvenIa-tab[data-customfilter]');
    const scopeOptions = document.querySelectorAll('.AnalInvenIa-scope-option');
    const selects = document.querySelectorAll('.AnalInvenIa-select');
    const insightTabs = document.querySelectorAll('.AnalInvenIa-insight-tab');
    const topProductTabs = document.querySelectorAll('.AnalInvenIa-tab[data-toptab]');
    const newAnalysisBtn = document.getElementById('AnalInvenIa-newAnalysis');
    const resetParamsBtn = document.getElementById('AnalInvenIa-resetParams');
    const toggleSummaryBtn = document.getElementById('AnalInvenIa-toggleSummary');

    // Configuration des éléments spécifiques
    const categorySelector = document.getElementById('AnalInvenIa-categorySelector');
    const productSelector = document.getElementById('AnalInvenIa-productSelector');
    const productSearchInput = document.getElementById('AnalInvenIa-productSearch');
    const productResults = document.getElementById('AnalInvenIa-productResults');
    const selectedProductDisplay = document.querySelector('.AnalInvenIa-selected-product');
    const selectedProductName = document.getElementById('AnalInvenIa-selectedProductName');
    const analysisTitle = document.getElementById('AnalInvenIa-analysisTitle');
    const analysisPeriod = document.getElementById('AnalInvenIa-analysisPeriod');
    const printResultsBtn = document.getElementById('AnalInvenIa-printResults');
    const exportResultsBtn = document.getElementById('AnalInvenIa-exportResults');
    const viewAllRecommendationsBtn = document.getElementById('AnalInvenIa-viewAllRecommendations');
    const viewAllProductsBtn = document.getElementById('AnalInvenIa-viewAllProducts');
    const viewAllPredictionsBtn = document.getElementById('AnalInvenIa-viewAllPredictions');
    const chartControls = document.querySelectorAll('.AnalInvenIa-chart-control');

    // Variables d'état
    let currentFilter = 1;
    let currentCustomFilter = 'range';
    let currentScope = 'global';
    let selectedCategory = null;
    let selectedProduct = null;
    let currentInterval = 'day';
    let currentRelativePeriod = 'today';
    let currentChartPeriod = 'month';
    let charts = {};

    // ====== Initialisation ======
    // Remplir les sélecteurs de catégories
    initCategorySelectors();
    
    // Préparer le champ de recherche de produits
    initProductSearch();

    // ====== Gestion des événements ======
    // Gestion des onglets de filtres
    filterTabs.forEach(tab => {
        tab.addEventListener('click', function() {
            const filterId = this.getAttribute('data-filter');
            currentFilter = parseInt(filterId);
            
            // Désactiver tous les onglets et contenus
            filterTabs.forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.AnalInvenIa-filter-content').forEach(content => {
                content.classList.remove('active');
            });
            
            // Activer l'onglet et le contenu sélectionnés
            this.classList.add('active');
            document.getElementById(`AnalInvenIa-filter${filterId}`).classList.add('active');
        });
    });
    
    // Gestion des onglets de filtres personnalisés
    customFilterTabs.forEach(tab => {
        tab.addEventListener('click', function() {
            const customFilterId = this.getAttribute('data-customfilter');
            currentCustomFilter = customFilterId;
            
            // Désactiver tous les onglets et contenus
            customFilterTabs.forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.AnalInvenIa-custom-filter').forEach(content => {
                content.classList.remove('active');
            });
            
            // Activer l'onglet et le contenu sélectionnés
            this.classList.add('active');
            document.getElementById(`AnalInvenIa-custom${customFilterId.charAt(0).toUpperCase() + customFilterId.slice(1)}`).classList.add('active');
        });
    });
    
    // Gestion des options de portée d'analyse
    scopeOptions.forEach(option => {
        option.addEventListener('click', function() {
            const scope = this.getAttribute('data-scope');
            currentScope = scope;
            
            // Désactiver toutes les options
            scopeOptions.forEach(opt => opt.classList.remove('active'));
            
            // Activer l'option sélectionnée
            this.classList.add('active');
            
            // Afficher/masquer les sélecteurs appropriés
            categorySelector.style.display = scope === 'category' ? 'block' : 'none';
            productSelector.style.display = scope === 'product' ? 'block' : 'none';
        });
    });
    
    // Gestion des select personnalisés
    selects.forEach(select => {
        const selectId = select.id;
        
        select.addEventListener('click', function() {
            this.classList.toggle('active');
        });
        
        const options = select.querySelectorAll('.AnalInvenIa-select-option');
        options.forEach(option => {
            option.addEventListener('click', function(e) {
                e.stopPropagation();
                const value = this.getAttribute('data-value');
                const displayText = this.textContent.trim();
                
                // Mettre à jour l'affichage du sélecteur
                const valueDisplay = select.querySelector('.AnalInvenIa-select-value');
                
                if (selectId === 'AnalInvenIa-intervalSelect') {
                    currentInterval = value;
                    const icon = this.querySelector('i').className;
                    valueDisplay.innerHTML = `<i class="${icon} me-2"></i>${displayText}`;
                } else if (selectId === 'AnalInvenIa-relativeSelect') {
                    currentRelativePeriod = value;
                    const icon = this.querySelector('i').className;
                    valueDisplay.innerHTML = `<i class="${icon} me-2"></i>${displayText}`;
                } else if (selectId === 'AnalInvenIa-categorySelect') {
                    selectedCategory = value;
                    const icon = this.querySelector('i').className;
                    valueDisplay.innerHTML = `<i class="${icon} me-2"></i>${displayText}`;
                } else {
                    valueDisplay.textContent = displayText;
                }
                
                select.classList.remove('active');
            });
        });
    });
    
    // Fermer les selects lors d'un clic à l'extérieur
    document.addEventListener('click', function(e) {
        if (!e.target.closest('.AnalInvenIa-select')) {
            selects.forEach(select => select.classList.remove('active'));
        }
        if (!e.target.closest('.AnalInvenIa-search-container') && productResults) {
            productResults.style.display = 'none';
        }
    });
    
    // Gestion des onglets d'insights
    insightTabs.forEach(tab => {
        tab.addEventListener('click', function() {
            const tabId = this.getAttribute('data-tab');
            
            // Désactiver tous les onglets et contenus
            insightTabs.forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.AnalInvenIa-insight-content').forEach(content => {
                content.classList.remove('active');
            });
            
            // Activer l'onglet et le contenu sélectionnés
            this.classList.add('active');
            document.getElementById(`AnalInvenIa-tab-${tabId}`).classList.add('active');
        });
    });
    
    // Gestion des onglets de top produits
    topProductTabs.forEach(tab => {
        tab.addEventListener('click', function() {
            const tabId = this.getAttribute('data-toptab');
            
            // Désactiver tous les onglets et contenus
            topProductTabs.forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.AnalInvenIa-top-products').forEach(content => {
                content.classList.remove('active');
            });
            
            // Activer l'onglet et le contenu sélectionnés
            this.classList.add('active');
            document.getElementById(`AnalInvenIa-${tabId}`).classList.add('active');
            
            // Remplir le contenu si nécessaire
            fillTopProductsContent(tabId);
        });
    });
    
    // Gestion du bouton d'analyse
    analyzeBtn.addEventListener('click', function() {
        startAnalysis();
    });
    
    document.getElementById('AnalInvenIa-runAnalysis').addEventListener('click', function() {
        startAnalysis();
    });
    
    // Gestion du bouton de réinitialisation
    resetParamsBtn.addEventListener('click', function() {
        resetAnalysisParams();
    });
    
    // Gestion du bouton de nouvelle analyse
    newAnalysisBtn.addEventListener('click', function() {
        document.getElementById('AnalInvenIa-results').style.display = 'none';
        document.querySelector('.card').style.display = 'block';
    });
    
    // Gestion du bouton pour développer/réduire le résumé
    toggleSummaryBtn.addEventListener('click', function() {
        const summaryContent = document.getElementById('AnalInvenIa-summaryContent');
        const isCollapsed = summaryContent.style.maxHeight === '0px' || !summaryContent.style.maxHeight;
        
        if (isCollapsed) {
            summaryContent.style.maxHeight = summaryContent.scrollHeight + 'px';
            this.innerHTML = '<i class="fas fa-chevron-up"></i>';
        } else {
            summaryContent.style.maxHeight = '0px';
            this.innerHTML = '<i class="fas fa-chevron-down"></i>';
        }
    });

    // Gestion de la suppression d'un produit sélectionné
    const removeProductBtn = document.querySelector('.AnalInvenIa-remove-product');
    if (removeProductBtn) {
        removeProductBtn.addEventListener('click', function() {
            selectedProduct = null;
            selectedProductDisplay.style.display = 'none';
        });
    }

    // Gestion des contrôles des graphiques
    chartControls.forEach(control => {
        control.addEventListener('click', function() {
            const period = this.getAttribute('data-period');
            currentChartPeriod = period;
            
            // Mettre à jour l'état actif
            chartControls.forEach(c => c.classList.remove('active'));
            this.classList.add('active');
            
            // Mettre à jour le graphique
            updateSalesChart(period);
        });
    });

    // Gestion des boutons d'action des résultats
    if (printResultsBtn) {
        printResultsBtn.addEventListener('click', function() {
            alert("Fonctionnalité d'impression: cette fonctionnalité sera implémentée ultérieurement.");
        });
    }
    
    if (exportResultsBtn) {
        exportResultsBtn.addEventListener('click', function() {
            alert("Fonctionnalité d'export PDF: cette fonctionnalité sera implémentée ultérieurement.");
        });
    }

    if (viewAllRecommendationsBtn) {
        viewAllRecommendationsBtn.addEventListener('click', function() {
            // Activer l'onglet Recommandations
            document.querySelector('.AnalInvenIa-insight-tab[data-tab="recommendations"]').click();
            fillRecommendationsTab();
        });
    }

    if (viewAllProductsBtn) {
        viewAllProductsBtn.addEventListener('click', function() {
            // Activer l'onglet Produits
            document.querySelector('.AnalInvenIa-insight-tab[data-tab="products"]').click();
            fillProductsTab();
        });
    }

    if (viewAllPredictionsBtn) {
        viewAllPredictionsBtn.addEventListener('click', function() {
            // Activer l'onglet Prévisions
            document.querySelector('.AnalInvenIa-insight-tab[data-tab="predictions"]').click();
            fillPredictionsTab();
        });
    }

    // Gestion de la barre latérale
    const sidebarItems = document.querySelectorAll('.nav-item');
    sidebarItems.forEach(item => {
        item.addEventListener('click', function() {
            // Désactiver tous les éléments
            sidebarItems.forEach(i => i.classList.remove('active'));
            
            // Activer l'élément cliqué
            this.classList.add('active');
            
            // Cacher toutes les sections
            document.querySelectorAll('.content-section').forEach(section => {
                section.style.display = 'none';
            });
            
            // Afficher la section correspondante
            const sectionId = this.getAttribute('data-section');
            const section = document.getElementById(sectionId);
            if (section) {
                section.style.display = 'block';
            }
        });
    });

    // ====== Fonctions ======
    // Initialiser les sélecteurs de catégories
    function initCategorySelectors() {
        const categorySelect = document.getElementById('AnalInvenIa-categorySelect');
        const dropdown = categorySelect.querySelector('.AnalInvenIa-select-dropdown');
        
        // Vider le dropdown existant
        dropdown.innerHTML = '';
        
        // Ajouter les catégories
        mockCategories.forEach(category => {
            const option = document.createElement('div');
            option.className = 'AnalInvenIa-select-option';
            option.setAttribute('data-value', category.id);
            option.innerHTML = `<i class="${category.icon} me-2"></i>${category.name}`;
            dropdown.appendChild(option);
            
            option.addEventListener('click', function(e) {
                e.stopPropagation();
                selectedCategory = category.id;
                categorySelect.querySelector('.AnalInvenIa-select-value').innerHTML = `<i class="${category.icon} me-2"></i>${category.name}`;
                categorySelect.classList.remove('active');
            });
        });
    }

    // Initialiser la recherche de produits
    function initProductSearch() {
        if (!productSearchInput) return;
        
        productSearchInput.addEventListener('input', function() {
            const searchTerm = this.value.trim().toLowerCase();
            
            if (searchTerm.length < 2) {
                productResults.style.display = 'none';
                return;
            }
            
            // Filtrer les produits
            const matchingProducts = mockProducts.filter(product => 
                product.name.toLowerCase().includes(searchTerm)
            );
            
            // Afficher les résultats
            displayProductSearchResults(matchingProducts);
        });
        
        productSearchInput.addEventListener('focus', function() {
            if (this.value.trim().length >= 2) {
                productResults.style.display = 'block';
            }
        });
    }

    // Afficher les résultats de recherche de produits
    function displayProductSearchResults(products) {
        if (!productResults) return;
        
        productResults.innerHTML = '';
        
        if (products.length === 0) {
            productResults.innerHTML = '<div class="AnalInvenIa-search-no-results">Aucun produit trouvé</div>';
            productResults.style.display = 'block';
            return;
        }
        
        products.forEach(product => {
            const resultItem = document.createElement('div');
            resultItem.className = 'AnalInvenIa-search-result';
            resultItem.innerHTML = `
                <i class="fas fa-box me-2"></i>
                <span>${product.name}</span>
                <span class="AnalInvenIa-result-stock">Stock: ${product.stock}</span>
            `;
            
            resultItem.addEventListener('click', function() {
                selectedProduct = product;
                productSearchInput.value = '';
                productResults.style.display = 'none';
                
                // Afficher le produit sélectionné
                selectedProductName.textContent = product.name;
                selectedProductDisplay.style.display = 'block';
            });
            
            productResults.appendChild(resultItem);
        });
        
        productResults.style.display = 'block';
    }

    // Démarrer l'analyse
    function startAnalysis() {
        const loaderEl = document.getElementById('AnalInvenIa-analyzeLoader');
        const progressBar = document.getElementById('AnalInvenIa-loaderProgressBar');
        const statusEl = document.getElementById('AnalInvenIa-loaderStatus');
        const resultsEl = document.getElementById('AnalInvenIa-results');
        
        // Cacher les paramètres et afficher le loader
        document.querySelector('.card').style.display = 'none';
        loaderEl.style.display = 'block';
        
        // Préparer le titre de l'analyse
        updateAnalysisTitle();
        
        // Simuler le chargement
        let progress = 0;
        const progressSteps = [
            { percent: 10, message: "Collecte des données d'inventaire..." },
            { percent: 30, message: "Analyse des tendances de vente..." },
            { percent: 50, message: "Calcul des prévisions..." },
            { percent: 70, message: "Génération des recommandations..." },
            { percent: 90, message: "Finalisation du rapport d'analyse..." },
            { percent: 100, message: "Analyse terminée!" }
        ];
        
        let currentStep = 0;
        progressBar.style.width = '0%';
        
        const interval = setInterval(() => {
            if (currentStep < progressSteps.length) {
                const step = progressSteps[currentStep];
                progress = step.percent;
                progressBar.style.width = `${progress}%`;
                statusEl.textContent = step.message;
                currentStep++;
                
                if (currentStep === progressSteps.length) {
                    setTimeout(() => {
                        clearInterval(interval);
                        loaderEl.style.display = 'none';
                        resultsEl.style.display = 'block';
                        
                        // Mettre à jour le contenu des onglets
                        fillOverviewTab();
                        updateProfitableTab();
                        updateCriticalTab();
                        
                        // Initialiser les graphiques
                        initCharts();
                    }, 800);
                }
            }
        }, 800);
    }

    // Mettre à jour le titre de l'analyse
    function updateAnalysisTitle() {
        let title = "";
        let period = "";
        
        // Déterminer la portée
        if (currentScope === 'global') {
            title = "Analyse globale de l'inventaire";
        } else if (currentScope === 'category' && selectedCategory) {
            const category = mockCategories.find(cat => cat.id === selectedCategory);
            title = `Analyse de la catégorie ${category ? category.name : ''}`;
        } else if (currentScope === 'product' && selectedProduct) {
            title = `Analyse du produit ${selectedProduct.name}`;
        } else {
            title = "Analyse de l'inventaire";
        }
        
        // Déterminer la période
        const now = new Date();
        
        if (currentFilter === 1) { // Intervalles
            if (currentInterval === 'day') {
                period = "Journalier - " + formatDate(now);
            } else if (currentInterval === 'week') {
                period = "Hebdomadaire - Semaine du " + formatDate(new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000));
            } else if (currentInterval === 'month') {
                period = "Mensuel - " + getMonthName(now.getMonth()) + " " + now.getFullYear();
            } else if (currentInterval === 'year') {
                period = "Annuel - " + now.getFullYear();
            } else {
                period = "Horaire - " + formatTime(now);
            }
        } else if (currentFilter === 2) { // Période relative
            if (currentRelativePeriod === 'now') {
                period = "À l'instant";
            } else if (currentRelativePeriod === 'today') {
                period = "Aujourd'hui - " + formatDate(now);
            } else if (currentRelativePeriod === 'yesterday') {
                const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
                period = "Hier - " + formatDate(yesterday);
            } else if (currentRelativePeriod === 'thisWeek') {
                period = "Cette semaine";
            } else if (currentRelativePeriod === 'lastWeek') {
                period = "Semaine dernière";
            } else if (currentRelativePeriod === 'thisMonth') {
                period = "Ce mois - " + getMonthName(now.getMonth()) + " " + now.getFullYear();
            } else if (currentRelativePeriod === 'lastMonth') {
                let lastMonth = now.getMonth() - 1;
                let year = now.getFullYear();
                if (lastMonth < 0) {
                    lastMonth = 11;
                    year--;
                }
                period = "Mois dernier - " + getMonthName(lastMonth) + " " + year;
            } else if (currentRelativePeriod === 'thisYear') {
                period = "Cette année - " + now.getFullYear();
            } else if (currentRelativePeriod === 'lastYear') {
                period = "Année dernière - " + (now.getFullYear() - 1);
            }
        } else if (currentFilter === 3) { // Personnalisé
            if (currentCustomFilter === 'range') {
                const startDate = document.getElementById('AnalInvenIa-startDate').value;
                const endDate = document.getElementById('AnalInvenIa-endDate').value;
                period = startDate && endDate ? `Du ${startDate} au ${endDate}` : "Période personnalisée";
            } else if (currentCustomFilter === 'year') {
                const yearSelect = document.getElementById('AnalInvenIa-yearSelect');
                const yearValue = yearSelect.querySelector('.AnalInvenIa-select-value').textContent.trim();
                period = `Année ${yearValue}`;
            } else if (currentCustomFilter === 'month') {
                const monthSelect = document.getElementById('AnalInvenIa-monthSelect');
                const yearSelect = document.getElementById('AnalInvenIa-yearForMonthSelect');
                const monthValue = monthSelect.querySelector('.AnalInvenIa-select-value').textContent.trim();
                const yearValue = yearSelect.querySelector('.AnalInvenIa-select-value').textContent.trim();
                period = `${monthValue} ${yearValue}`;
            } else if (currentCustomFilter === 'day') {
                const dayInput = document.getElementById('AnalInvenIa-day').value;
                const monthSelect = document.getElementById('AnalInvenIa-monthForDaySelect');
                const yearSelect = document.getElementById('AnalInvenIa-yearForDaySelect');
                const monthValue = monthSelect.querySelector('.AnalInvenIa-select-value').textContent.trim();
                const yearValue = yearSelect.querySelector('.AnalInvenIa-select-value').textContent.trim();
                period = `${dayInput} ${monthValue} ${yearValue}`;
            }
        }
        
        analysisTitle.textContent = title;
        analysisPeriod.textContent = period;
    }

    // Initialiser les graphiques
    function initCharts() {
        // Graphique d'évolution des ventes
        updateSalesChart(currentChartPeriod);
        
        // Graphique des prévisions par catégorie
        const ctx2 = document.getElementById('AnalInvenIa-categoryPredictionChart');
        if (ctx2) {
            const categoryLabels = mockCategories.map(cat => cat.name);
            const predictionData = mockCategories.map(cat => cat.prediction);
            
            charts.categoryPrediction = new Chart(ctx2, {
                type: 'bar',
                data: {
                    labels: categoryLabels,
                    datasets: [{
                        label: 'Prévision de croissance (%)',
                        data: predictionData,
                        backgroundColor: predictionData.map(value => value >= 0 ? 'rgba(75, 192, 192, 0.6)' : 'rgba(255, 99, 132, 0.6)'),
                        borderColor: predictionData.map(value => value >= 0 ? 'rgb(75, 192, 192)' : 'rgb(255, 99, 132)'),
                        borderWidth: 1
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        y: {
                            beginAtZero: true,
                            ticks: {
                                callback: function(value) {
                                    return value + '%';
                                }
                            }
                        }
                    },
                    plugins: {
                        legend: {
                            display: false
                        },
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    let label = context.dataset.label || '';
                                    if (label) {
                                        label += ': ';
                                    }
                                    if (context.parsed.y !== null) {
                                        label += context.parsed.y + '%';
                                    }
                                    return label;
                                }
                            }
                        }
                    }
                }
            });
        }
    }

    // Mettre à jour le graphique des ventes
    function updateSalesChart(period) {
        const ctx = document.getElementById('AnalInvenIa-salesChart');
        if (!ctx) return;
        
        // Préparer les données selon la période
        let labels, data;
        
        if (period === 'week') {
            labels = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
            data = mockSalesData.week;
        } else if (period === 'month') {
            labels = Array.from({ length: 30 }, (_, i) => i + 1);
            data = mockSalesData.month;
        } else if (period === 'year') {
            labels = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];
            data = mockSalesData.year;
        }
        
        // Créer ou mettre à jour le graphique
        if (charts.sales) {
            charts.sales.data.labels = labels;
            charts.sales.data.datasets[0].data = data;
            charts.sales.update();
        } else {
            charts.sales = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: labels,
                    datasets: [{
                        label: 'Ventes (€)',
                        data: data,
                        backgroundColor: 'rgba(54, 162, 235, 0.2)',
                        borderColor: 'rgba(54, 162, 235, 1)',
                        borderWidth: 2,
                        tension: 0.4,
                        pointRadius: 3,
                        pointBackgroundColor: 'rgba(54, 162, 235, 1)'
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        y: {
                            beginAtZero: true,
                            ticks: {
                                callback: function(value) {
                                    return value + '€';
                                }
                            }
                        }
                    },
                    plugins: {
                        legend: {
                            display: false
                        },
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    let label = context.dataset.label || '';
                                    if (label) {
                                        label += ': ';
                                    }
                                    if (context.parsed.y !== null) {
                                        label += context.parsed.y + '€';
                                    }
                                    return label;
                                }
                            }
                        }
                    }
                }
            });
        }
    }

    // Remplir l'onglet Aperçu
    function fillOverviewTab() {
        // Mettre à jour les KPIs
        document.getElementById('AnalInvenIa-totalValue').textContent = '24 850';
        document.getElementById('AnalInvenIa-salesValue').textContent = '12 450';
        document.getElementById('AnalInvenIa-stockIssues').textContent = '5';
        
        // Onglet par défaut pour les produits
        fillTopProductsContent('bestsellers');
    }

    // Remplir le contenu des top produits
    function fillTopProductsContent(tabId) {
        if (tabId === 'bestsellers') {
            // Déjà rempli dans le HTML statique
        } else if (tabId === 'profitable') {
            const profitableEl = document.getElementById('AnalInvenIa-profitable');
            if (!profitableEl) return;
            
            // Trier les produits par rentabilité (approximative)
            const profitableProducts = [...mockProducts]
                .sort((a, b) => (b.price * b.sold) - (a.price * a.sold))
                .slice(0, 5);
            
            profitableEl.innerHTML = '';
            
            profitableProducts.forEach((product, index) => {
                const profit = product.price * product.sold;
                const trenDirection = product.trend >= 0 ? 'positive' : 'negative';
                const trendIcon = product.trend > 0 ? 'fa-arrow-up' : product.trend < 0 ? 'fa-arrow-down' : 'fa-equals';
                
                const productEl = document.createElement('div');
                productEl.className = 'AnalInvenIa-product-ranking';
                productEl.innerHTML = `
                    <div class="AnalInvenIa-product-rank">${index + 1}</div>
                    <div class="AnalInvenIa-product-info">
                        <div class="AnalInvenIa-product-name">${product.name}</div>
                        <div class="AnalInvenIa-product-stats">
                            <span class="AnalInvenIa-product-stat">
                                <i class="fas fa-euro-sign me-1"></i> Profit: ${profit}€
                            </span>
                            <span class="AnalInvenIa-product-stat">
                                <i class="fas fa-shopping-cart me-1"></i> Vendus: ${product.sold}
                            </span>
                        </div>
                    </div>
                    <div class="AnalInvenIa-product-trend ${trenDirection}">
                        <i class="fas ${trendIcon}"></i> ${Math.abs(product.trend)}%
                    </div>
                `;
                
                profitableEl.appendChild(productEl);
            });
        } else if (tabId === 'critical') {
            const criticalEl = document.getElementById('AnalInvenIa-critical');
            if (!criticalEl) return;
            
            // Filtrer les produits en situation critique (stocks faibles avec ventes élevées ou surstockage)
            const criticalProducts = mockProducts.filter(product => 
                (product.stock < 15 && product.sold > 40) || // rupture probable
                (product.stock > 50 && product.sold < 20)    // surstockage
            ).slice(0, 5);
            
            criticalEl.innerHTML = '';
            
            criticalProducts.forEach((product, index) => {
                const isSurplus = product.stock > 50 && product.sold < 20;
                const statusClass = isSurplus ? 'surplus' : 'shortage';
                const statusIcon = isSurplus ? 'fa-boxes-stacked' : 'fa-triangle-exclamation';
                const statusText = isSurplus ? 'Surstockage' : 'Rupture probable';
                
                const productEl = document.createElement('div');
                productEl.className = 'AnalInvenIa-product-ranking';
                productEl.innerHTML = `
                    <div class="AnalInvenIa-product-rank">${index + 1}</div>
                    <div class="AnalInvenIa-product-info">
                        <div class="AnalInvenIa-product-name">${product.name}</div>
                        <div class="AnalInvenIa-product-stats">
                            <span class="AnalInvenIa-product-stat">
                                <i class="fas fa-box me-1"></i> Stock: ${product.stock}
                            </span>
                            <span class="AnalInvenIa-product-stat">
                                <i class="fas fa-shopping-cart me-1"></i> Vendus: ${product.sold}
                            </span>
                        </div>
                    </div>
                    <div class="AnalInvenIa-product-status ${statusClass}">
                        <i class="fas ${statusIcon}"></i> ${statusText}
                    </div>
                `;
                
                criticalEl.appendChild(productEl);
            });
        }
    }

    // Mettre à jour l'onglet des produits rentables
    function updateProfitableTab() {
        fillTopProductsContent('profitable');
    }

    // Mettre à jour l'onglet des produits critiques
    function updateCriticalTab() {
        fillTopProductsContent('critical');
    }

    // Remplir l'onglet Produits
    function fillProductsTab() {
        const productsTab = document.getElementById('AnalInvenIa-tab-products');
        if (!productsTab) return;
        
        productsTab.innerHTML = `
            <div class="card mb-4">
                <div class="card-header d-flex justify-content-between align-items-center">
                    <span><i class="fas fa-boxes me-2"></i> Analyse détaillée des produits</span>
                    <div class="AnalInvenIa-products-filter">
                        <div class="input-group input-group-sm">
                            <input type="text" class="form-control" placeholder="Rechercher..." id="AnalInvenIa-productTabSearch">
                            <button class="btn btn-outline-secondary dropdown-toggle" type="button" data-bs-toggle="dropdown">
                                <i class="fas fa-sort me-1"></i> Trier par
                            </button>
                            <ul class="dropdown-menu">
                                <li><a class="dropdown-item" href="#" data-sort="stock-desc">Stock (décroissant)</a></li>
                                <li><a class="dropdown-item" href="#" data-sort="stock-asc">Stock (croissant)</a></li>
                                <li><a class="dropdown-item" href="#" data-sort="sales-desc">Ventes (décroissant)</a></li>
                                <li><a class="dropdown-item" href="#" data-sort="sales-asc">Ventes (croissant)</a></li>
                                <li><a class="dropdown-item" href="#" data-sort="price-desc">Prix (décroissant)</a></li>
                                <li><a class="dropdown-item" href="#" data-sort="price-asc">Prix (croissant)</a></li>
                            </ul>
                        </div>
                    </div>
                </div>
                <div class="card-body p-0">
                    <div class="table-responsive">
                        <table class="table table-hover">
                            <thead>
                                <tr>
                                    <th>Produit</th>
                                    <th>Catégorie</th>
                                    <th>Stock</th>
                                    <th>Vendus</th>
                                    <th>Prix</th>
                                    <th>Valeur Stock</th>
                                    <th>Tendance</th>
                                    <th>Statut</th>
                                </tr>
                            </thead>
                            <tbody id="AnalInvenIa-productsTableBody">
                                <!-- Sera rempli dynamiquement -->
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
            
            <div class="row">
                <div class="col-md-6">
                    <div class="card mb-4">
                        <div class="card-header">
                            <i class="fas fa-chart-pie me-2"></i> Répartition par catégorie
                        </div>
                        <div class="card-body">
                            <div class="AnalInvenIa-chart-container">
                                <canvas id="AnalInvenIa-categoriesChart"></canvas>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="col-md-6">
                    <div class="card mb-4">
                        <div class="card-header">
                            <i class="fas fa-fire me-2"></i> Rotation des stocks
                        </div>
                        <div class="card-body">
                            <div class="AnalInvenIa-chart-container">
                                <canvas id="AnalInvenIa-stockRotationChart"></canvas>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // Remplir le tableau de produits
        const productsTableBody = document.getElementById('AnalInvenIa-productsTableBody');
        if (productsTableBody) {
            productsTableBody.innerHTML = '';
            
            mockProducts.forEach(product => {
                const category = mockCategories.find(cat => cat.id === product.category);
                const stockValue = product.stock * product.price;
                const trendClass = product.trend > 0 ? 'positive' : product.trend < 0 ? 'negative' : 'neutral';
                const trendIcon = product.trend > 0 ? 'fa-arrow-up' : product.trend < 0 ? 'fa-arrow-down' : 'fa-equals';
                
                // Déterminer le statut
                let status, statusClass;
                if (product.stock < 15 && product.sold > 40) {
                    status = 'Rupture probable';
                    statusClass = 'danger';
                } else if (product.stock > 50 && product.sold < 20) {
                    status = 'Surstockage';
                    statusClass = 'warning';
                } else if (product.trend > 10) {
                    status = 'Forte demande';
                    statusClass = 'success';
                } else {
                    status = 'Normal';
                    statusClass = 'primary';
                }
                
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${product.name}</td>
                    <td>${category ? category.name : 'N/A'}</td>
                    <td>${product.stock}</td>
                    <td>${product.sold}</td>
                    <td>${product.price}€</td>
                    <td>${stockValue}€</td>
                    <td>
                        <span class="AnalInvenIa-trend ${trendClass}">
                            <i class="fas ${trendIcon}"></i> ${Math.abs(product.trend)}%
                        </span>
                    </td>
                    <td><span class="badge bg-${statusClass}">${status}</span></td>
                `;
                
                productsTableBody.appendChild(tr);
            });
        }
        
        // Initialiser les graphiques
        initProductsCharts();
    }

    // Initialiser les graphiques de l'onglet Produits
    function initProductsCharts() {
        // Graphique de répartition par catégorie
        const categoriesCanvas = document.getElementById('AnalInvenIa-categoriesChart');
        if (categoriesCanvas) {
            // Calculer les totaux par catégorie
            const categoryTotals = {};
            mockCategories.forEach(cat => {
                categoryTotals[cat.id] = {
                    name: cat.name,
                    stockValue: 0,
                    salesValue: 0
                };
            });
            
            mockProducts.forEach(product => {
                if (categoryTotals[product.category]) {
                    categoryTotals[product.category].stockValue += product.stock * product.price;
                    categoryTotals[product.category].salesValue += product.sold * product.price;
                }
            });
            
            const labels = Object.values(categoryTotals).map(cat => cat.name);
            const stockData = Object.values(categoryTotals).map(cat => cat.stockValue);
            
            new Chart(categoriesCanvas, {
                type: 'pie',
                data: {
                    labels: labels,
                    datasets: [{
                        data: stockData,
                        backgroundColor: [
                            'rgba(54, 162, 235, 0.7)',
                            'rgba(255, 99, 132, 0.7)',
                            'rgba(255, 206, 86, 0.7)',
                            'rgba(75, 192, 192, 0.7)'
                        ]
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'right'
                        },
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    const value = context.raw;
                                    const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                    const percentage = Math.round((value / total) * 100);
                                    return `${context.label}: ${value}€ (${percentage}%)`;
                                }
                            }
                        }
                    }
                }
            });
        }
        
        // Graphique de rotation des stocks
        const rotationCanvas = document.getElementById('AnalInvenIa-stockRotationChart');
        if (rotationCanvas) {
            // Calculer le taux de rotation pour chaque produit
            const topRotationProducts = [...mockProducts]
                .map(product => ({
                    name: product.name,
                    rotation: product.sold / (product.stock > 0 ? product.stock : 1)
                }))
                .sort((a, b) => b.rotation - a.rotation)
                .slice(0, 7);
            
            const labels = topRotationProducts.map(p => p.name);
            const data = topRotationProducts.map(p => p.rotation);
            
            new Chart(rotationCanvas, {
                type: 'bar',
                data: {
                    labels: labels,
                    datasets: [{
                        label: 'Taux de rotation',
                        data: data,
                        backgroundColor: 'rgba(75, 192, 192, 0.7)',
                        borderColor: 'rgb(75, 192, 192)',
                        borderWidth: 1
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    indexAxis: 'y',
                    scales: {
                        x: {
                            beginAtZero: true
                        }
                    },
                    plugins: {
                        legend: {
                            display: false
                        },
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    return `Taux de rotation: ${context.raw.toFixed(2)}`;
                                }
                            }
                        }
                    }
                }
            });
        }
    }

    // Remplir l'onglet Prévisions
    function fillPredictionsTab() {
        const predictionsTab = document.getElementById('AnalInvenIa-tab-predictions');
        if (!predictionsTab) return;
        
        predictionsTab.innerHTML = `
            <div class="card mb-4">
                <div class="card-header">
                    <i class="fas fa-crystal-ball me-2"></i> Prévisions IA des ventes
                </div>
                <div class="card-body">
                    <div class="AnalInvenIa-prediction-header mb-4">
                        <h4>Prévisions pour les 3 prochains mois</h4>
                        <p class="text-muted">Basées sur l'historique des ventes et les tendances du marché</p>
                    </div>
                    
                    <div class="AnalInvenIa-chart-container mb-4">
                        <canvas id="AnalInvenIa-salesPredictionChart"></canvas>
                    </div>
                    
                    <div class="AnalInvenIa-prediction-insights">
                        <div class="AnalInvenIa-insight-card">
                            <div class="AnalInvenIa-insight-icon">
                                <i class="fas fa-chart-line"></i>
                            </div>
                            <div class="AnalInvenIa-insight-content">
                                <h5>Croissance continue</h5>
                                <p>Nos algorithmes prévoient une croissance globale de 12% pour le prochain trimestre.</p>
                            </div>
                        </div>
                        <div class="AnalInvenIa-insight-card">
                            <div class="AnalInvenIa-insight-icon">
                                <i class="fas fa-calendar"></i>
                            </div>
                            <div class="AnalInvenIa-insight-content">
                                <h5>Pics saisonniers</h5>
                                <p>Préparez-vous à un pic de ventes en juillet avec une augmentation estimée de 22%.</p>
                            </div>
                        </div>
                        <div class="AnalInvenIa-insight-card">
                            <div class="AnalInvenIa-insight-icon">
                                <i class="fas fa-lightbulb"></i>
                            </div>
                            <div class="AnalInvenIa-insight-content">
                                <h5>Opportunités</h5>
                                <p>L'analyse des tendances suggère un potentiel important pour la catégorie Électronique.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="row">
                <div class="col-md-7">
                    <div class="card mb-4">
                        <div class="card-header d-flex justify-content-between align-items-center">
                            <span><i class="fas fa-exclamation-triangle me-2"></i> Alertes de stock prévisionnelles</span>
                            <div class="AnalInvenIa-prediction-period">
                                Pour les 30 prochains jours
                            </div>
                        </div>
                        <div class="card-body p-0">
                            <div class="table-responsive">
                                <table class="table table-hover">
                                    <thead>
                                        <tr>
                                            <th>Produit</th>
                                            <th>Stock actuel</th>
                                            <th>Prévision de vente</th>
                                            <th>Date de rupture estimée</th>
                                            <th>Action recommandée</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr>
                                            <td>Smartphone XL+</td>
                                            <td>32</td>
                                            <td>30 / mois</td>
                                            <td>Dans 32 jours</td>
                                            <td><span class="badge bg-warning">Commander bientôt</span></td>
                                        </tr>
                                        <tr>
                                            <td>Montre connectée Sport</td>
                                            <td>28</td>
                                            <td>25 / mois</td>
                                            <td>Dans 34 jours</td>
                                            <td><span class="badge bg-warning">Commander bientôt</span></td>
                                        </tr>
                                        <tr>
                                            <td>Écouteurs sans fil Pro</td>
                                            <td>45</td>
                                            <td>22 / mois</td>
                                            <td>Dans 61 jours</td>
                                            <td><span class="badge bg-success">Stock suffisant</span></td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="col-md-5">
                    <div class="card mb-4">
                        <div class="card-header">
                            <i class="fas fa-calculator me-2"></i> Estimation financière
                        </div>
                        <div class="card-body">
                            <div class="AnalInvenIa-finance-predictions">
                                <div class="AnalInvenIa-finance-item">
                                    <div class="AnalInvenIa-finance-label">Chiffre d'affaires estimé (prochain mois)</div>
                                    <div class="AnalInvenIa-finance-value">14 800 €</div>
                                    <div class="AnalInvenIa-finance-trend positive">
                                        <i class="fas fa-arrow-up me-1"></i> +12% vs mois précédent
                                    </div>
                                </div>
                                <div class="AnalInvenIa-finance-item">
                                    <div class="AnalInvenIa-finance-label">Produit le plus rentable (prévision)</div>
                                    <div class="AnalInvenIa-finance-product">Smartphone XL+</div>
                                    <div class="AnalInvenIa-finance-value">4 250 €</div>
                                </div>
                                <div class="AnalInvenIa-finance-item">
                                    <div class="AnalInvenIa-finance-label">Catégorie en plus forte croissance</div>
                                    <div class="AnalInvenIa-finance-product">Électronique</div>
                                    <div class="AnalInvenIa-finance-trend positive">
                                        <i class="fas fa-arrow-up me-1"></i> +18%
                                    </div>
                                </div>
                            </div>
                            <div class="AnalInvenIa-prediction-chart-container mt-4">
                                <canvas id="AnalInvenIa-financePredictionChart"></canvas>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        initPredictionCharts();
    }

    // Initialiser les graphiques de prévision
    function initPredictionCharts() {
        // Graphique de prévision des ventes
        const salesPredictionCanvas = document.getElementById('AnalInvenIa-salesPredictionChart');
        if (salesPredictionCanvas) {
            const months = ['Mai', 'Juin', 'Juillet', 'Août'];
            const historicalData = [11200, 12450, null, null];
            const predictedData = [null, null, 14000, 15600];
            
            new Chart(salesPredictionCanvas, {
                type: 'line',
                data: {
                    labels: months,
                    datasets: [{
                        label: 'Données historiques',
                        data: historicalData,
                        borderColor: 'rgba(54, 162, 235, 1)',
                        backgroundColor: 'rgba(54, 162, 235, 0.2)',
                        borderWidth: 2,
                        pointRadius: 4,
                        fill: true
                    }, {
                        label: 'Prévisions',
                        data: predictedData,
                        borderColor: 'rgba(255, 99, 132, 1)',
                        backgroundColor: 'rgba(255, 99, 132, 0.2)',
                        borderWidth: 2,
                        borderDash: [5, 5],
                        pointRadius: 4,
                        fill: true
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        y: {
                            beginAtZero: false,
                            ticks: {
                                callback: function(value) {
                                    return value + '€';
                                }
                            }
                        }
                    },
                    plugins: {
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    let label = context.dataset.label || '';
                                    if (label) {
                                        label += ': ';
                                    }
                                    if (context.parsed.y !== null) {
                                        label += context.parsed.y + '€';
                                    }
                                    return label;
                                }
                            }
                        }
                    }
                }
            });
        }
        
        // Graphique de prévision financière
        const financePredictionCanvas = document.getElementById('AnalInvenIa-financePredictionChart');
        if (financePredictionCanvas) {
            const categories = ['Électronique', 'Mobilier', 'Vêtements', 'Alimentaire'];
            const currentData = [8200, 2300, 1500, 950];
            const forecastData = [9676, 2415, 1470, 1045];
            
            new Chart(financePredictionCanvas, {
                type: 'bar',
                data: {
                    labels: categories,
                    datasets: [{
                        label: 'Ce mois-ci',
                        data: currentData,
                        backgroundColor: 'rgba(54, 162, 235, 0.7)',
                        borderColor: 'rgb(54, 162, 235)',
                        borderWidth: 1
                    }, {
                        label: 'Mois prochain (prévision)',
                        data: forecastData,
                        backgroundColor: 'rgba(255, 99, 132, 0.7)',
                        borderColor: 'rgb(255, 99, 132)',
                        borderWidth: 1
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        y: {
                            beginAtZero: false,
                            ticks: {
                                callback: function(value) {
                                    return value + '€';
                                }
                            }
                        }
                    },
                    plugins: {
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    let label = context.dataset.label || '';
                                    if (label) {
                                        label += ': ';
                                    }
                                    if (context.parsed.y !== null) {
                                        label += context.parsed.y + '€';
                                    }
                                    return label;
                                }
                            }
                        }
                    }
                }
            });
        }
    }

    // Remplir l'onglet Recommandations
    function fillRecommendationsTab() {
        const recommendationsTab = document.getElementById('AnalInvenIa-tab-recommendations');
        if (!recommendationsTab) return;
        
        recommendationsTab.innerHTML = `
            <div class="AnalInvenIa-recommendations-header mb-4">
                <div class="AnalInvenIa-recommendations-title">
                    <i class="fas fa-lightbulb me-2"></i>
                    <h4>Recommandations IA</h4>
                </div>
                <div class="AnalInvenIa-recommendations-summary">
                    Notre intelligence artificielle a analysé vos données et vous propose des actions concrètes pour optimiser votre gestion.
                </div>
            </div>
            
            <div class="row">
                <div class="col-md-8">
                    <div class="card mb-4">
                        <div class="card-header">
                            <i class="fas fa-star me-2"></i> Recommandations prioritaires
                        </div>
                        <div class="card-body p-0">
                            <div class="AnalInvenIa-recommendation-list" id="AnalInvenIa-priorityRecommendations">
                                <!-- Sera rempli dynamiquement -->
                            </div>
                        </div>
                    </div>
                </div>
                <div class="col-md-4">
                    <div class="card mb-4">
                        <div class="card-header">
                            <i class="fas fa-chart-bar me-2"></i> Impact estimé
                        </div>
                        <div class="card-body">
                            <div class="AnalInvenIa-impact">
                                <div class="AnalInvenIa-impact-item">
                                    <div class="AnalInvenIa-impact-icon positive">
                                        <i class="fas fa-hand-holding-usd"></i>
                                    </div>
                                    <div class="AnalInvenIa-impact-content">
                                        <div class="AnalInvenIa-impact-value">+2 400 €</div>
                                        <div class="AnalInvenIa-impact-label">Revenus additionnels</div>
                                    </div>
                                </div>
                                <div class="AnalInvenIa-impact-item">
                                    <div class="AnalInvenIa-impact-icon positive">
                                        <i class="fas fa-percent"></i>
                                    </div>
                                    <div class="AnalInvenIa-impact-content">
                                        <div class="AnalInvenIa-impact-value">+14%</div>
                                        <div class="AnalInvenIa-impact-label">Marge optimisée</div>
                                    </div>
                                </div>
                                <div class="AnalInvenIa-impact-item">
                                    <div class="AnalInvenIa-impact-icon negative">
                                        <i class="fas fa-coins"></i>
                                    </div>
                                    <div class="AnalInvenIa-impact-content">
                                        <div class="AnalInvenIa-impact-value">-3 800 €</div>
                                        <div class="AnalInvenIa-impact-label">Réduction des surstockages</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="card mb-4">
                <div class="card-header">
                    <i class="fas fa-list-check me-2"></i> Toutes les recommandations
                </div>
                <div class="card-body p-0">
                    <div class="AnalInvenIa-tabs AnalInvenIa-tabs-small">
                        <div class="AnalInvenIa-tab active" data-rectab="all">
                            <i class="fas fa-border-all"></i> Toutes
                        </div>
                        <div class="AnalInvenIa-tab" data-rectab="stock">
                            <i class="fas fa-box"></i> Stock
                        </div>
                        <div class="AnalInvenIa-tab" data-rectab="pricing">
                            <i class="fas fa-tag"></i> Prix
                        </div>
                        <div class="AnalInvenIa-tab" data-rectab="marketing">
                            <i class="fas fa-bullhorn"></i> Marketing
                        </div>
                    </div>
                    <div class="AnalInvenIa-recommendation-grid" id="AnalInvenIa-allRecommendations">
                        <!-- Sera rempli dynamiquement -->
                    </div>
                </div>
            </div>
        `;
        
        // Remplir les recommandations prioritaires
        const priorityRecommendationsEl = document.getElementById('AnalInvenIa-priorityRecommendations');
        if (priorityRecommendationsEl) {
            const topRecommendations = mockRecommendations.slice(0, 3);
            
            priorityRecommendationsEl.innerHTML = '';
            topRecommendations.forEach(rec => {
                const recItem = document.createElement('div');
                recItem.className = 'AnalInvenIa-recommendation-item';
                recItem.innerHTML = `
                    <div class="AnalInvenIa-recommendation-icon">
                        <i class="${rec.icon}"></i>
                    </div>
                    <div class="AnalInvenIa-recommendation-content">
                        <div class="AnalInvenIa-recommendation-title">${rec.title}</div>
                        <div class="AnalInvenIa-recommendation-description">
                            ${rec.description}
                        </div>
                    </div>
                    <div class="AnalInvenIa-recommendation-action">
                        <button class="btn btn-sm btn-outline-primary">Appliquer</button>
                    </div>
                `;
                
                priorityRecommendationsEl.appendChild(recItem);
            });
        }
        
        // Remplir toutes les recommandations
        const allRecommendationsEl = document.getElementById('AnalInvenIa-allRecommendations');
        if (allRecommendationsEl) {
            allRecommendationsEl.innerHTML = '';
            
            mockRecommendations.forEach(rec => {
                const recItem = document.createElement('div');
                recItem.className = 'AnalInvenIa-recommendation-card';
                recItem.setAttribute('data-rectype', getRecommendationType(rec.type));
                recItem.innerHTML = `
                    <div class="AnalInvenIa-recommendation-card-header">
                        <div class="AnalInvenIa-recommendation-card-icon">
                            <i class="${rec.icon}"></i>
                        </div>
                        <div class="AnalInvenIa-recommendation-card-badge ${getRecommendationClass(rec.type)}">
                            ${getRecommendationLabel(rec.type)}
                        </div>
                    </div>
                    <div class="AnalInvenIa-recommendation-card-title">${rec.title}</div>
                    <div class="AnalInvenIa-recommendation-card-description">
                        ${rec.description}
                    </div>
                    <div class="AnalInvenIa-recommendation-card-footer">
                        <button class="btn btn-sm btn-outline-secondary">Ignorer</button>
                        <button class="btn btn-sm btn-primary">Appliquer</button>
                    </div>
                `;
                
                allRecommendationsEl.appendChild(recItem);
            });
            
            // Ajouter la gestion des onglets de recommandations
            const recTabs = document.querySelectorAll('.AnalInvenIa-tab[data-rectab]');
            recTabs.forEach(tab => {
                tab.addEventListener('click', function() {
                    const tabId = this.getAttribute('data-rectab');
                    
                    // Désactiver tous les onglets
                    recTabs.forEach(t => t.classList.remove('active'));
                    
                    // Activer l'onglet sélectionné
                    this.classList.add('active');
                    
                    // Filtrer les recommandations
                    const recCards = document.querySelectorAll('.AnalInvenIa-recommendation-card');
                    recCards.forEach(card => {
                        if (tabId === 'all' || card.getAttribute('data-rectype') === tabId) {
                            card.style.display = 'flex';
                        } else {
                            card.style.display = 'none';
                        }
                    });
                });
            });
        }
    }

    // Déterminer le type de recommandation pour le filtrage
    function getRecommendationType(type) {
        switch (type) {
            case 'increase_stock':
            case 'reduce_stock':
            case 'restock':
                return 'stock';
            case 'price_up':
            case 'price_down':
                return 'pricing';
            case 'promotion':
            case 'bundle':
                return 'marketing';
            default:
                return 'other';
        }
    }

    // Obtenir la classe CSS pour le badge de recommandation
    function getRecommendationClass(type) {
        switch (type) {
            case 'increase_stock':
            case 'restock':
            case 'price_up':
                return 'success';
            case 'reduce_stock':
            case 'price_down':
                return 'warning';
            case 'promotion':
            case 'bundle':
                return 'info';
            default:
                return 'primary';
        }
    }

    // Obtenir le label pour le badge de recommandation
    function getRecommendationLabel(type) {
        switch (type) {
            case 'increase_stock':
                return 'Augmenter Stock';
            case 'reduce_stock':
                return 'Réduire Stock';
            case 'restock':
                return 'Réapprovisionner';
            case 'price_up':
                return 'Augmenter Prix';
            case 'price_down':
                return 'Réduire Prix';
            case 'promotion':
                return 'Promotion';
            case 'bundle':
                return 'Bundle';
            default:
                return 'Action';
        }
    }

    // Réinitialiser les paramètres d'analyse
    function resetAnalysisParams() {
        // Réinitialiser les filtres
        filterTabs[0].click();
        customFilterTabs[0].click();
        
        // Réinitialiser la portée
        scopeOptions[0].click();
        
        // Réinitialiser les selects
        selects.forEach(select => {
            const defaultOption = select.querySelector('.AnalInvenIa-select-option');
            if (defaultOption) {
                select.querySelector('.AnalInvenIa-select-value').textContent = defaultOption.textContent.trim();
            }
        });
        
        // Réinitialiser les variables d'état
        currentFilter = 1;
        currentCustomFilter = 'range';
        currentScope = 'global';
        selectedCategory = null;
        selectedProduct = null;
        
        // Masquer les sélecteurs spécifiques
        categorySelector.style.display = 'none';
        productSelector.style.display = 'none';
        selectedProductDisplay.style.display = 'none';
    }

    // Formater une date
    function formatDate(date) {
        return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()}`;
    }

    // Formater une heure
    function formatTime(date) {
        return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
    }

    // Obtenir le nom du mois
    function getMonthName(monthIndex) {
        const months = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
        return months[monthIndex];
    }
    
    // Charger les dépendances externes (Chart.js)
    function loadChartJS() {
        if (window.Chart) return Promise.resolve();
        
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/chart.js';
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }
    
    // Charger Chart.js
    loadChartJS().then(() => {
        console.log('Chart.js chargé avec succès');
    }).catch(err => {
        console.error('Erreur lors du chargement de Chart.js:', err);
    });
});



/*══════════════════════════════╗
  🟡 JS PARTIE 6
  ═════════════════════════════╝*/


//══════════════════════════════╗
// 🟤 JS PARTIE 7
//══════════════════════════════╝


/*══════════════════════════════╗
  ⚫ JS PARTIE 8
  ═════════════════════════════╝*/