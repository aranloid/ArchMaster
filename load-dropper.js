import { Component, Property } from '@wonderlandengine/api';


export class LoadDropper extends Component {
    static TypeName = 'load-dropper';
    static Properties = {
        dropPoint: Property.object(),
        passengerTemplate: Property.object(),
        carTemplate: Property.object(),
        truckTemplate: Property.object(),
        planeTemplate: Property.object(),
        dropHeight: Property.float(3.0)
    };

    start() {
        this.templates = {
            passenger: this.passengerTemplate,
            car: this.carTemplate,
            truck: this.truckTemplate,
            plane: this.planeTemplate
        };

        console.log('LoadDropper: Initialized with drop height', this.dropHeight);
    }

    /**
     * Drop a load of given kind ("car", "truck", "plane", "passenger").
     * Optionally override height with customHeight.
     */
    dropLoad(kind, customHeight = null) {
        try {
            const template = this.templates[kind];
            if (!template) {
                console.warn(`LoadDropper: No template found for load type: ${kind}`);
                return null;
            }

            if (!this.dropPoint) {
                console.warn('LoadDropper: No dropPoint object assigned');
                return null;
            }

            const heightOffset = customHeight !== null ? customHeight : this.dropHeight;
            const dropPos = this.dropPoint.getTranslationWorld();
            const spawnPos = [dropPos[0], dropPos[1] + heightOffset, dropPos[2]];

            // --- FIXED PART: use clone(parent) instead of duplicate() ---
            const parent = template.parent || null;
            const load = template.clone(parent);
            load.setTranslationWorld(spawnPos);
            load.active = true;
            // ------------------------------------------------------------

            console.log(`LoadDropper: Dropped ${kind} from height ${heightOffset}m`);
            return load;

        } catch (e) {
            console.error('LoadDropper: Failed to drop load', e);
            return null;
        }
    }

    setDropHeight(height) {
        this.dropHeight = Math.max(0.5, height);
        console.log(`LoadDropper: Drop height set to ${this.dropHeight}m`);
    }
}

