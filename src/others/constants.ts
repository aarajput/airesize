export class Constants {
    static readonly TRANSPARENT_SVG = '<svg><rect x="0" y="0" width="200" height="200" rx="50" ry="50" fill="none"/></svg>';

    static getSolidSVG(color: string) {
        return `<svg><rect x="0" y="0" width="9999" height="9999" fill="#${color}"/></svg>`;
    }

    static getCircleSVG(color: string) {
        return `<svg x="0px" y="0px" viewBox="0 0 512 512" style="enable-background:new 0 0 512 512;" xml:space="preserve"> <path d="M256,0C115.39,0,0,115.39,0,256s115.39,256,256,256s256-115.39,256-256S396.61,0,256,0z" fill="#${color}"/> </svg>`;
    }
}
