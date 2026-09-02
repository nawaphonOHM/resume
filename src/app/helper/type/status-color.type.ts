import type {STATUS_COLORS} from '../injection-token/status_colors.type.ts';


/** One of the normalized colors supported by the availability indicator. */
export type StatusColor = (STATUS_COLORS)[keyof STATUS_COLORS];
