import { Component, Property } from '@wonderlandengine/api';

export class MaterialManager extends Component {
    static TypeName = 'material-manager';

    static Properties = {
        // Name of the default material the UI starts with
        defaultSelection: Property.string('concrete')
    };

    init() {
        this.selectedMaterial = this.defaultSelection || 'concrete';
        this.materialSettings = {};
    }

    start() {
        console.log('[MaterialManager] start() called');
        this.selectedMaterial = this.defaultSelection || 'concrete';
        console.log('[MaterialManager] Default material:', this.selectedMaterial);

        /* Central place for material data (density + color + capacity). */
        this.materialSettings = {
            concrete: {
                color: [0.5, 0.5, 0.5, 1.0],   // gray
                density: 2400.0,
                capacity: 200000.0
            },
            steel: {
                color: [0.7, 0.7, 0.8, 1.0],   // light gray-blue
                density: 7850.0,
                capacity: 800000.0
            },
            timber: {
                color: [0.6, 0.4, 0.2, 1.0],   // brown
                density: 600.0,
                capacity: 60000.0
            },
            ghostConcrete: {
                color: [0.5, 0.5, 0.5, 0.3],   // semi-transparent gray
                density: 2400.0,
                capacity: 200000.0
            },
            ghostSteel: {
                color: [0.7, 0.7, 0.8, 0.3],   // semi-transparent steel
                density: 7850.0,
                capacity: 800000.0
            }
        };

        console.log('[MaterialManager] Material settings initialized');
    }

    /** Set the currently selected material name. */
    selectMaterial(name) {
        if (!name) return;
        this.selectedMaterial = name;
        console.log('[MaterialManager] Material selected:', name);
    }

    /**
     * Apply material data + color to an instantiated object.
     *
     * @param {Object3D} root           Root of the instantiated object.
     * @param {string}   materialName   Base name: 'concrete', 'steel', 'timber', etc.
     * @param {boolean}  isGhost        Whether to use ghost variant (semi-transparent).
     */
    applyMaterialToInstance(root, materialName, isGhost) {
        if (!root) return;

        const baseName =
            materialName ||
            this.selectedMaterial ||
            this.defaultSelection ||
            'concrete';

        // For ghosts we use keys like "ghostConcrete", "ghostSteel", etc.
        const capitalized = baseName.charAt(0).toUpperCase() + baseName.slice(1);
        const fullMaterialName = isGhost ? 'ghost' + capitalized : baseName;

        const settings =
            this.materialSettings[fullMaterialName] ||
            this.materialSettings[baseName] ||
            this.materialSettings.concrete;

        console.log(
            '[MaterialManager] Applying material:',
            fullMaterialName,
            'settings:',
            settings
        );

        /* Apply color to all mesh components under this root */
        this._applyColorRecursive(root, settings.color);

        /* If this object has a BridgeBlock, propagate material properties */
        try {
            const bb = root.getComponent('bridge-block');
            if (bb) {
                bb.materialType = baseName;
                bb.density = settings.density;
                bb.capacity = settings.capacity;

                // Let BridgeBlock recompute its mass if it wants to
                if (typeof bb.onMaterialChanged === 'function') {
                    bb.onMaterialChanged();
                }

                // Also directly update mass on the PhysX body for robustness
                const rb =
                    root.getComponent('physx') ||
                    root.getComponent('rigidbody') ||
                    null;
                if (rb && bb.autoComputeMass) {
                    try {
                        const mass = Math.max(0.001, bb.density * bb.estimatedVolume);
                        rb.mass = mass;
                        console.log('[MaterialManager] Set mass to:', mass);
                    } catch (e) {
                        console.warn('[MaterialManager] Could not set rb.mass', e);
                    }
                }

                console.log('[MaterialManager] Updated bridge block:', {
                    materialType: bb.materialType,
                    density: bb.density,
                    capacity: bb.capacity
                });
            }
        } catch (e) {
            console.warn('[MaterialManager] Error updating bridge block:', e);
        }

        /* Store some metadata for debugging / later use */
        try {
            root.userData = root.userData || {};
            root.userData.materialName = baseName;
            root.userData.isGhost = !!isGhost;
        } catch (e) {
            // userData is optional; ignore if not supported
        }
    }

    /** Internal: recursively apply a color to this object and all its children. */
    _applyColorRecursive(obj, color) {
        if (!obj || !color) return;

        try {
            const meshes = obj.getComponents('mesh') || [];
            for (const mesh of meshes) {
                try {
                    if (mesh.material && mesh.material.baseColorFactor) {
                        mesh.material.baseColorFactor = color;
                    }
                } catch (_) {
                    /* ignore single-mesh errors */
                }
            }
        } catch (e) {
            console.warn('[MaterialManager] Error applying color to meshes:', e);
        }

        // Traverse hierarchy. Prefer getChildren(outArray) but also support obj.children.
        const children = [];
        try {
            obj.getChildren(children);
        } catch (e) {
            if (obj.children && obj.children.length) {
                for (const c of obj.children) children.push(c);
            }
        }

        for (const child of children) {
            this._applyColorRecursive(child, color);
        }
    }

    /** Public helper: apply a given color directly. */
    applyColorToInstance(root, color) {
        if (!root || !color) return;
        this._applyColorRecursive(root, color);
    }
}
