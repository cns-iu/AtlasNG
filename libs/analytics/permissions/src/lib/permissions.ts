import { AnalyticsEvent, AnalyticsEventCategory, getAnalyticsEventCategory } from '@atlasng/analytics/events';
import { Tagged } from 'type-fest';

/** A mapping of analytics categories to their permission status. */
type CategoryPermissions = Tagged<Readonly<Record<AnalyticsEventCategory, boolean>>, 'CategoryPermissions'>;

/** Default category permissions. */
const DEFAULT_CATEGORY_PERMISSIONS = {
  [AnalyticsEventCategory.Necessary]: true,
  [AnalyticsEventCategory.Statistics]: false,
  [AnalyticsEventCategory.Preferences]: false,
  [AnalyticsEventCategory.Marketing]: false,
} as CategoryPermissions;

/** Full category permissions. */
const FULL_CATEGORY_PERMISSIONS = {
  [AnalyticsEventCategory.Necessary]: true,
  [AnalyticsEventCategory.Statistics]: true,
  [AnalyticsEventCategory.Preferences]: true,
  [AnalyticsEventCategory.Marketing]: true,
} as CategoryPermissions;

/** Categories with fixed permissions. */
const REQUIRED_CATEGORY_PERMISSIONS: Pick<CategoryPermissions, AnalyticsEventCategory.Necessary> = {
  [AnalyticsEventCategory.Necessary]: true,
};

/**
 * Immutable analytics permission state.
 *
 * Instances behave like value objects: every mutation-style method returns a new
 * {@link Permissions} instance instead of changing the current one.
 */
export class Permissions {
  /** Lazily initialized cache for {@link Permissions.DEFAULT}. */
  static #default: Permissions | undefined;

  /** Lazily initialized cache for {@link Permissions.FULL}. */
  static #full: Permissions | undefined;

  /**
   * Default analytics permissions.
   */
  static get DEFAULT(): Permissions {
    return (this.#default ??= new Permissions(DEFAULT_CATEGORY_PERMISSIONS));
  }

  /**
   * All analytics permissions enabled.
   */
  static get FULL(): Permissions {
    return (this.#full ??= new Permissions(FULL_CATEGORY_PERMISSIONS));
  }

  /** The internal permission state. */
  readonly #permissions: CategoryPermissions;

  /**
   * Creates a new permissions value object.
   *
   * @param permissions The internal permission state (for internal use only).
   */
  constructor(permissions?: CategoryPermissions) {
    this.#permissions = permissions ?? DEFAULT_CATEGORY_PERMISSIONS;
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
  enableCategory(category: AnalyticsEventCategory): Permissions {
    return this.#updateCategories({ [category]: true });
  }

  /**
   * Returns a copy with the given category disabled.
   *
   * @param category The category to disable.
   * @returns A new permissions value object.
   */
  disableCategory(category: AnalyticsEventCategory): Permissions {
    return this.#updateCategories({ [category]: false });
  }

  /**
   * Returns a copy with the given category toggled.
   *
   * @param category The category to toggle.
   * @returns A new permissions value object.
   */
  toggleCategory(category: AnalyticsEventCategory): Permissions {
    const current = this.#permissions[category];
    return this.#updateCategories({ [category]: !current });
  }

  /**
   * Applies category updates while preserving required permissions.
   *
   * @param updates Partial category updates to apply.
   * @returns A new permissions value object.
   */
  #updateCategories(updates: Partial<CategoryPermissions>): Permissions {
    return new Permissions({ ...this.#permissions, ...updates, ...REQUIRED_CATEGORY_PERMISSIONS });
  }

  /**
   * Compares two permissions values for equality.
   *
   * @param other The permissions value to compare.
   * @returns Whether both values contain the same category flags.
   */
  equals(other: Permissions): boolean {
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
  static fromJSON(json: string, defaultPermissions?: Permissions): Permissions {
    const parsed = JSON.parse(json);
    if (typeof parsed !== 'object' || parsed === null) {
      throw new Error('Invalid AnalyticsPermissions JSON');
    }

    const categories = Object.values(AnalyticsEventCategory);
    const basePermissions = defaultPermissions ? defaultPermissions.#permissions : DEFAULT_CATEGORY_PERMISSIONS;
    const permissions = categories.reduce((acc, category) => {
      if (category in parsed) {
        const value = (parsed as Record<string, unknown>)[category];
        return { ...acc, [category]: Boolean(value) };
      }
      return acc;
    }, basePermissions);

    return new Permissions(permissions);
  }

  /**
   * Safely creates permissions from JSON.
   *
   * @param json The JSON payload to parse.
   * @param defaultPermissions Optional fallback permissions for missing categories.
   * @returns The parsed permissions, or `undefined` when parsing fails.
   */
  static tryFromJSON(json: string, defaultPermissions?: Permissions): Permissions | undefined {
    try {
      return Permissions.fromJSON(json, defaultPermissions);
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
