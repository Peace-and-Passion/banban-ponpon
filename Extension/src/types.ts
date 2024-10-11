/**
     Banban Ponpon: Type definitions

     @author Hirano Satoshi, Togashi Ayuto
     @copyright 2024 Peace and Passion
     @since 2024/10/02
 */

/**
  Data type used inquire UserInfo from Content script to hm-app.
 */
export interface UserInfoInquiry {
    type: 'getUserInfo',       // 'getUserInfo'
    returnEvent: string,       // Random string used for CustomEvent type by the page script
}

/**
  Data type retured for the UserInfoInquiry from hm-app to to Content script.
 */
export interface UserInfo {
    at: string;                // Access token or undefined
    atExp: number;             // Access token expiration time in UTC
    land_id: string;           // Land ID
    boardID?: string;           // Banban board ID or undefined
    boardTitle?: string;        // Banban board ID
    primaryColor: string;      // Primary color
    accentColor: string;       // Accent color
    appBarTextColor: string;   // App bar text color used in Primary color
}
