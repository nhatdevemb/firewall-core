include $(TOPDIR)/rules.mk

PKG_NAME:=bmcfirewall-core
PKG_VERSION:=1.0
PKG_RELEASE:=1

PKG_BUILD_DIR := $(BUILD_DIR)/$(PKG_NAME)

include $(INCLUDE_DIR)/package.mk

define Package/bmcfirewall-core
  SECTION:=Firewall
  CATEGORY:=BMC
  TITLE:=BMC Firewall Core
  DEPENDS:= +libpthread
endef

define Package/bmcfirewall-core/description
  Custom BMC Web UI with Node.js scripts installed to /etc/bmcweb.
endef

define Build/Prepare
	mkdir -p $(PKG_BUILD_DIR)
endef

define Build/Compile
	# Skip dev compile
endef

define Build/InstallDev
	# Skip dev install
endef

define Package/bmcfirewall-core/install
	$(INSTALL_DIR) $(1)/etc/bmcfirewall
	$(INSTALL_DIR) $(1)/etc/init.d
	
	cp -r ./src/* $(1)/etc/bmcfirewall/
	$(INSTALL_BIN) ./src/*.sh $(1)/etc/bmcfirewall/

	$(INSTALL_BIN) ./files/bmcfirewall.init $(1)/etc/init.d/bmcfirewall
endef

$(eval $(call BuildPackage,bmcfirewall-core))
