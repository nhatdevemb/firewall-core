#
# This is free software, licensed under the GNU General Public License v2.
# See /LICENSE for more information.
#

include $(TOPDIR)/rules.mk

PKG_NAME:=bmcfirewall
PKG_VERSION:=1.0.0
PKG_RELEASE:=1

PKG_SOURCE:=bmcfirewall-$(PKG_VERSION).tar.gz
PKG_SRC_DIR :=$(DL_DIR)/$(PKG_NAME)-$(PKG_VERSION)
PKG_BUILD_DIR :=$(BUILD_DIR)/$(PKG_NAME)-$(PKG_VERSION)
PKG_UNPACK=mkdir -p $(PKG_BUILD_DIR); $(CP) $(PKG_SRC_DIR)/. $(PKG_BUILD_DIR)/
HOST_UNPACK=mkdir -p $(HOST_BUILD_DIR); $(CP) $(PKG_SRC_DIR)/. $(HOST_BUILD_DIR)/

PKG_LICENSE:=GPL-3.0-only
PKG_LICENSE_FILES:=LICENSE.txt
PKG_CPE_ID:=cpe:/a:adguard:adguardhome
PKG_MAINTAINER:=Dobroslaw Kijowski <dobo90@gmail.com>

PKG_BUILD_DEPENDS:=golang/host node/host
PKG_BUILD_PARALLEL:=1
PKG_BUILD_FLAGS:=no-mips16

GO_PKG:=github.com/AdguardTeam/AdGuardHome
GO_PKG_BUILD_PKG:=github.com/AdguardTeam/AdGuardHome

AGH_BUILD_TIME:=$(shell date -d @$(SOURCE_DATE_EPOCH) +%FT%TZ%z)
AGH_VERSION_PKG:=github.com/AdguardTeam/AdGuardHome/internal/version
GO_PKG_LDFLAGS_X:=$(AGH_VERSION_PKG).channel=release \
	$(AGH_VERSION_PKG).version=$(PKG_VERSION) \
	$(AGH_VERSION_PKG).buildtime=$(AGH_BUILD_TIME) \
	$(AGH_VERSION_PKG).goarm=$(GO_ARM) \
	$(AGH_VERSION_PKG).gomips=$(GO_MIPS)

include $(INCLUDE_DIR)/package.mk
include ../../../feeds/packages/lang/golang/golang-package.mk

define Package/bmcfirewall
	SECTION:=bmc
	CATEGORY:=Network
	TITLE:=Network-wide ads and trackers blocking DNS server
	DEPENDS:=$(GO_ARCH_DEPENDS) +ca-bundle
endef

define Package/bmcfirewall/conffiles
/etc/adguardhome.yaml
/etc/config/adguardhome
endef

define Package/bmcfirewall/description
Free and open source, powerful network-wide ads and trackers blocking DNS server.
endef

define Build/Compile
	( \
		pushd $(PKG_BUILD_DIR) ; \
		make js-deps js-build ; \
		popd ; \
		$(call GoPackage/Build/Compile) ; \
	)
endef

define Package/bmcfirewall/install
	$(call GoPackage/Package/Install/Bin,$(1))
	$(INSTALL_DIR) $(1)/etc/init.d
	$(INSTALL_BIN) ./files/bmcfirewall.init $(1)/etc/init.d/bmcfirewall

	$(INSTALL_DIR) $(1)/etc/config
	$(INSTALL_DATA) ./files/bmcfirewall.config $(1)/etc/config/bmcfirewall
	mv $(1)/usr/bin/AdGuardHome $(1)/usr/bin/bmcfirewall
endef

$(eval $(call GoBinPackage,bmcfirewall))
$(eval $(call BuildPackage,bmcfirewall))
