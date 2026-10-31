/**
 * Elevation tokens. Structured layers are the single source; CSS strings and React Native shadow props are derived.
 * Values are the Teacher Portal's multi-layer "physical paper" drop shadows.
 */
export interface ShadowLayer {
    x: number;
    y: number;
    blur: number;
    spread: number;
    /** r, g, b, alpha */
    color: readonly [number, number, number, number];
    inset?: boolean;
}
export type ShadowName = 'paper' | 'lift' | 'sticky' | 'neon' | 'button' | 'buttonHover' | 'selected' | 'focusRing' | 'inputInset' | 'stampInset' | 'tape';
export declare const lightShadows: Record<ShadowName, ShadowLayer[]>;
/** Dark mode uses flat, deeper shadows (Teacher `.dark`); neon is unchanged. */
export declare const darkShadows: Record<ShadowName, ShadowLayer[]>;
/** Serialise layers exactly the way the Teacher stylesheet writes them. */
export declare function shadowToCss(layers: ShadowLayer[]): string;
export interface NativeShadow {
    shadowColor: string;
    shadowOffset: {
        width: number;
        height: number;
    };
    shadowOpacity: number;
    shadowRadius: number;
    elevation: number;
}
/**
 * React Native supports one shadow per view: use the dominant (largest blur) layer. shadowRadius ~= blur / 2 per the
 * CSS -> RN convention. `elevation` is the Android approximation.
 */
export declare function shadowToNative(layers: ShadowLayer[]): NativeShadow;
export declare const shadowsFor: (scheme: "light" | "dark") => Record<ShadowName, ShadowLayer[]>;
