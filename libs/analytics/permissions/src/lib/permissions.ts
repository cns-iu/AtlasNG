import { AnalyticsEvent, AnalyticsEventCategory, getAnalyticsEventCategory } from '@atlasng/analytics/events';

/** A mapping of analytics categories to their permission status. */
type CategoryPermissions = Readonly<Record<AnalyticsEventCategory, boolean>>;

/** Default category permissions. */
export const DEFAULT_CATEGORY_PERMISSIONS: CategoryPermissions = {
  [AnalyticsEventCategory.Necessary]: true,
  [AnalyticsEventCategory.Statistics]: false,
  [AnalyticsEventCategory.Preferences]: false,
  [AnalyticsEventCategory.Marketing]: false,
};

/** Full category permissions. */
export const FULL_CATEGORY_PERMISSIONS: CategoryPermissions = {
  [AnalyticsEventCategory.Necessary]: true,
  [AnalyticsEventCategory.Statistics]: true,
  [AnalyticsEventCategory.Preferences]: true,
  [AnalyticsEventCategory.Marketing]: true,
};

/** Categories with fixed permissions. */
const REQUIRED_CATEGORY_PERMISSIONS: Pick<CategoryPermissions, AnalyticsEventCategory.Necessary> = {
  [AnalyticsEventCategory.Necessary]: true,
};

/** Arguments used to privately initialize an {@link AnalyticsPermissions} instance. */
type AnalyticsPermissionsArgs = [permissions: CategoryPermissions];

/** The default arguments for the {@link AnalyticsPermissions} constructor. */
const DEFAULT_CONSTRUCTOR_ARGS: AnalyticsPermissionsArgs = [DEFAULT_CATEGORY_PERMISSIONS];

/** Arguments staged for the next {@link AnalyticsPermissions} construction. */
let constructorArgs: AnalyticsPermissionsArgs | undefined;

/**
 * Creates a permissions instance with privately supplied constructor arguments.
 *
 * The staged arguments are cleared after construction, even if the constructor throws.
 *
 * @param args The internal permission state for the new instance.
 * @returns A permissions value object containing the supplied state.
 */
function createAnalyticsPermissions(...args: AnalyticsPermissionsArgs): AnalyticsPermissions {
  try {
    constructorArgs = args;
    return new AnalyticsPermissions();
  } finally {
    constructorArgs = undefined;
  }
}

/** Cached {@link AnalyticsPermissions.DEFAULT} instance. */
let cachedDefaultPermissions: AnalyticsPermissions | undefined;
/** Cached {@link AnalyticsPermissions.FULL} instance. */
let cachedFullPermissions: AnalyticsPermissions | undefined;

/**
 * Immutable analytics permission state.
 *
 * Instances behave like value objects: every mutation-style method returns a new
 * {@link AnalyticsPermissions} instance instead of changing the current one.
 */
export class AnalyticsPermissions {
  /** Default analytics permissions. */
  static get DEFAULT(): AnalyticsPermissions {
    cachedDefaultPermissions ??= createAnalyticsPermissions(DEFAULT_CATEGORY_PERMISSIONS);
    return cachedDefaultPermissions;
  }

  /** All analytics permissions enabled. */
  static get FULL(): AnalyticsPermissions {
    cachedFullPermissions ??= createAnalyticsPermissions(FULL_CATEGORY_PERMISSIONS);
    return cachedFullPermissions;
  }

  /** The internal permission state. */
  readonly #permissions: CategoryPermissions;

  /**
   * Create a fresh instance of {@link AnalyticsPermissions}.
   */
  constructor() {
    const [permissions] = constructorArgs ?? DEFAULT_CONSTRUCTOR_ARGS;
    this.#permissions = permissions;
  }

  /**
   * Checks whether a category is enabled.
   *
   * @param category The analytics category to inspect.
   * @returns Whether the category is enabled.
   */
  isCategoryEnabled(category: AnalyticsEventCategory): boolean {
    return this.#permissions[category];
  }

  /**
   * Checks whether an event is enabled.
   *
   * @param event The analytics event to inspect.
   * @returns Whether the event is enabled.
   */
  isEventEnabled(event: AnalyticsEvent): boolean {
    const category = getAnalyticsEventCategory(event);
    return this.isCategoryEnabled(category);
  }

  /**
   * Returns a copy with the given category enabled.
   *
   * @param category The category to enable.
   * @returns A new permissions value object.
   */
  enableCategory(category: AnalyticsEventCategory): AnalyticsPermissions {
    return this.#updateCategories({ [category]: true });
  }

  /**
   * Returns a copy with the given category disabled.
   *
   * @param category The category to disable.
   * @returns A new permissions value object.
   */
  disableCategory(category: AnalyticsEventCategory): AnalyticsPermissions {
    return this.#updateCategories({ [category]: false });
  }

  /**
   * Returns a copy with the given category toggled.
   *
   * @param category The category to toggle.
   * @returns A new permissions value object.
   */
  toggleCategory(category: AnalyticsEventCategory): AnalyticsPermissions {
    const current = this.#permissions[category];
    return this.#updateCategories({ [category]: !current });
  }

  /**
   * Returns a copy with the given category set to the specified enabled state.
   *
   * @param category The category to update.
   * @param enabled The new enabled state for the category.
   * @returns A new permissions value object.
   */
  setCategory(category: AnalyticsEventCategory, enabled: boolean): AnalyticsPermissions {
    return this.#updateCategories({ [category]: enabled });
  }

  /**
   * Applies category updates while preserving required permissions.
   *
   * @param updates Partial category updates to apply.
   * @returns A new permissions value object.
   */
  #updateCategories(updates: Partial<CategoryPermissions>): AnalyticsPermissions {
    return createAnalyticsPermissions({ ...this.#permissions, ...updates, ...REQUIRED_CATEGORY_PERMISSIONS });
  }

  /**
   * Compares two permissions values for equality.
   *
   * @param other The permissions value to compare.
   * @returns Whether both values contain the same category flags.
   */
  equals(other: AnalyticsPermissions): boolean {
    if (this === other || this.#permissions === other.#permissions) {
      return true;
    }

    const categories = Object.values(AnalyticsEventCategory);
    return categories.every((category) => this.#permissions[category] === other.#permissions[category]);
  }

  /**
   * Creates permissions from a JSON string.
   *
   * @param json The JSON payload to parse.
   * @param defaultPermissions Optional fallback permissions for missing categories.
   * @returns A new permissions value object.
   */
  static fromJSON(json: string, defaultPermissions?: AnalyticsPermissions): AnalyticsPermissions {
    const parsed = JSON.parse(json);
    if (typeof parsed !== 'object' || parsed === null) {
      throw new Error('Invalid AnalyticsPermissions JSON');
    }

    const categories = Object.values(AnalyticsEventCategory);
    const base = defaultPermissions ?? AnalyticsPermissions.DEFAULT;
    const permissions = categories.reduce<Partial<CategoryPermissions>>((acc, category) => {
      if (category in parsed) {
        const value = (parsed as Record<string, unknown>)[category];
        return { ...acc, [category]: Boolean(value) };
      }
      return acc;
    }, {});

    return base.#updateCategories(permissions);
  }

  /**
   * Safely creates permissions from JSON.
   *
   * @param json The JSON payload to parse.
   * @param defaultPermissions Optional fallback permissions for missing categories.
   * @returns The parsed permissions, or `undefined` when parsing fails.
   */
  static tryFromJSON(json: string, defaultPermissions?: AnalyticsPermissions): AnalyticsPermissions | undefined {
    try {
      return AnalyticsPermissions.fromJSON(json, defaultPermissions);
    } catch {
      return undefined;
    }
  }

  /**
   * Serializes the permissions value.
   *
   * @returns A JSON-serializable plain object.
   */
  toJSON(): unknown {
    return { ...this.#permissions };
  }
}
